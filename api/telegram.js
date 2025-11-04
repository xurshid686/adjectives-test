module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, surname, correctAnswers, totalQuestions, score, answers, questions } = req.body;

    if (!name || !surname) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Format the message
    let message = `🎯 *Adjectives & Degrees Test Results*\n`;
    message += `👤 *Student:* ${name} ${surname}\n`;
    message += `📊 *Score:* ${correctAnswers}/${totalQuestions} (${score}%)\n`;
    message += `📝 *Test:* Comparative and Superlative Degrees\n\n`;
    message += `*Detailed Results:*\n`;

    answers.forEach((answer, index) => {
      const emoji = answer.isCorrect ? '✅' : '❌';
      const correctText = answer.isCorrect ? '' : ` (Correct: "${answer.correct}")`;
      message += `Q${index + 1}: ${emoji} - Your answer: "${answer.selected}"${correctText}\n`;
    });

    message += `\n🏆 *Performance:* ${score >= 80 ? 'Excellent! 🎉' : score >= 60 ? 'Good! 👍' : 'Needs improvement! 📚'}\n`;
    message += `⏰ *Test completed at:* ${new Date().toLocaleString()}`;

    // Get Telegram credentials
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Missing Telegram credentials');
      return res.status(500).json({ 
        success: false, 
        error: 'Telegram bot not configured' 
      });
    }

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
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

    const telegramResult = await telegramResponse.json();

    if (telegramResult.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Results sent to Telegram successfully' 
      });
    } else {
      console.error('Telegram API error:', telegramResult);
      return res.status(500).json({ 
        success: false, 
        error: telegramResult.description || 'Telegram API error' 
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    });
  }
};
