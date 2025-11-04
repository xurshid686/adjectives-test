export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { name, surname, correctAnswers, totalQuestions, score, answers, questions } = req.body;
      
      console.log('Received data for Telegram:', { name, surname, correctAnswers, totalQuestions, score });

      // Format the message
      const message = `
🎯 *Adjectives & Degrees Test Results*
👤 *Student:* ${name} ${surname}
📊 *Score:* ${correctAnswers}/${totalQuestions} (${score}%)
📝 *Test:* Comparative and Superlative Degrees

*Detailed Results:*
${answers.map((answer, index) => {
  return `Q${index + 1}: ${answer.isCorrect ? '✅' : '❌'} - Your answer: "${answer.selected}" ${!answer.isCorrect ? `(Correct: "${answer.correct}")` : ''}`;
}).join('\n')}

🏆 *Performance:* ${score >= 80 ? 'Excellent! 🎉' : score >= 60 ? 'Good! 👍' : 'Needs improvement! 📚'}
⏰ *Test completed at:* ${new Date().toLocaleString()}
      `;

      // Get Telegram credentials from environment variables
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      console.log('Bot Token exists:', !!botToken);
      console.log('Chat ID exists:', !!chatId);

      if (!botToken || !chatId) {
        console.error('Telegram credentials missing');
        return res.status(500).json({ 
          success: false, 
          error: 'Telegram credentials not configured in environment variables' 
        });
      }

      console.log('Sending to Telegram...');

      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      const result = await telegramResponse.json();
      console.log('Telegram API response:', result);

      if (result.ok) {
        res.status(200).json({ 
          success: true, 
          message: 'Results sent to Telegram successfully' 
        });
      } else {
        console.error('Telegram API error:', result);
        res.status(500).json({ 
          success: false, 
          error: result.description || 'Unknown Telegram API error'
        });
      }
    } catch (error) {
      console.error('Error in telegram API:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  } else {
    res.status(405).json({ 
      message: 'Method not allowed' 
    });
  }
}
