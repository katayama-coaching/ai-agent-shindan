const { Resend } = require('resend');
const { google } = require('googleapis');

const RESULT_CONTENT = {
  'ChatGPT/Codexタイプ': {
    reason: 'AIと会話しながら考えを整理し、やりたいことを形にしていくのが得意なタイプです。ChatGPTやCodexのようなAIと相性が良いです。',
    firstStep: 'まずは作りたいものを1つ決めて、AIに「何を作りたいか」「誰に使ってほしいか」を相談するところから始めましょう。',
    review: '第6章「Codexとは何か？ ChatGPTとの関係と今後の可能性」を読み返すと、ChatGPTとCodexをどう使い分けるかが整理できます。'
  },
  'Cursorタイプ': {
    reason: '実際に手を動かしながら、AIに助けてもらって少しずつ形にしていくのが得意なタイプです。',
    firstStep: 'まずは小さな画面や文章を1つだけ直して、AIに「ここをもっと分かりやすくして」と頼んでみましょう。',
    review: '第8章「AI時代に必要なのはコード力ではなく設計力 ハーネスという考え方」を読み返すと、AIに何をどう任せるかが分かりやすくなります。'
  },
  'Windsurfタイプ': {
    reason: 'AIからの提案を受け取りながら、流れよく作業を進めるのが得意なタイプです。',
    firstStep: '毎日やっている作業を1つ選び、AIに「もっと楽に進める方法を考えて」と相談してみましょう。',
    review: '第9章「あなた専用AIチームを持つ未来」を読み返すと、AIに先回りして助けてもらう未来像がつかみやすくなります。'
  },
  'Claude Codeタイプ': {
    reason: 'すぐに進めるよりも、きちんと理解してから進みたいタイプです。説明が丁寧なAIや、間違いを確認してくれるAIと相性が良いです。',
    firstStep: '作業を始める前に、AIに「この進め方で間違いがないか確認して」と聞いてみましょう。',
    review: '第7章「初心者が99％ハマる失敗 AIが自信満々に間違える理由」を読み返すと、AIの答えを安全に使うコツが分かります。'
  },
  'Devin/OpenHandsタイプ': {
    reason: '細かい作業をAIに任せ、全体の流れや完成形を見ながら進めるのが得意なタイプです。',
    firstStep: 'まずはAIに任せたい作業を1つ決めて、「目的」「完成イメージ」「確認してほしいこと」を書き出してみましょう。',
    review: '第5章「自律AIエージェントの世界」と第9章「あなた専用AIチームを持つ未来」を読み返すと、AIに仕事を任せるイメージが具体的になります。'
  }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, consent, resultType, answers, inflow } = req.body || {};
    if (!name || !email || !consent || !resultType || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const content = RESULT_CONTENT[resultType] || RESULT_CONTENT['ChatGPT/Codexタイプ'];
    const now = new Date().toISOString();
    const answersText = answers.map((a, i) => `Q${i + 1}:${a.answer}`).join(' / ');

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'あなたに向いているAIエージェント診断結果',
      text:
`【診断結果】\n${resultType}\n\n【向いている理由】\n${content.reason}\n\n【最初の一歩】\n${content.firstStep}\n\n【本の復習ポイント】\n${content.review}\n\n---\nこのメールは診断結果と今後のご案内を希望された方にお送りしています。\n配信停止をご希望の場合は、このメールに「配信停止希望」と返信してください。`
    });

    const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${process.env.GOOGLE_SHEET_NAME}!A:G`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[now, name, email, resultType, answersText, inflow || 'Kindle読者特典', consent ? '同意あり' : '同意なし']]
      }
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', detail: e.message });
  }
};
