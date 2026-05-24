const { Resend } = require('resend');
const { google } = require('googleapis');

const RESULT_CONTENT = {
  '相談しながら進めるタイプ｜おすすめAI：ChatGPT＋Codex': {
    shortType: '相談しながら進めるタイプ',
    recommendedAI: 'ChatGPT＋Codex',
    reason: 'AIと会話しながら考えを整理し、やりたいことを形にしていくのが得意なタイプです。',
    strength: '「考える → 相談する → 形にする」この流れがあなたの強みです。',
    firstStep: 'まずは作りたいものを1つ決めて、AIに「何を作りたいか」「誰に使ってほしいか」を相談するところから始めましょう。',
    review: '第6章「Codexとは何か？ ChatGPTとの関係と今後の可能性」を読み返すと、ChatGPTとCodexをどう使い分けるかが整理できます。'
  },
  '手を動かして作るタイプ｜おすすめAI：Cursor': {
    shortType: '手を動かして作るタイプ',
    recommendedAI: 'Cursor',
    reason: '実際に手を動かしながら、AIに助けてもらって少しずつ形にしていくのが得意なタイプです。',
    strength: '「考える → 試す → 直す」この流れがあなたの強みです。',
    firstStep: 'まずは小さな文章や画面を1つだけ直して、AIに「ここをもっと分かりやすくして」とお願いしてみましょう。',
    review: '第8章「AI時代に必要なのはコード力ではなく設計力 ハーネスという考え方」を読み返すと、AIに何をどう任せるかが分かりやすくなります。'
  },
  '流れに乗って進めるタイプ｜おすすめAI：Windsurf': {
    shortType: '流れに乗って進めるタイプ',
    recommendedAI: 'Windsurf',
    reason: 'AIからの提案を受け取りながら、流れよく作業を進めるのが得意なタイプです。',
    strength: '「任せる → 受け取る → 進める」この流れがあなたの強みです。',
    firstStep: '毎日やっている作業を1つ選び、AIに「もっと楽に進める方法を考えて」と相談してみましょう。',
    review: '第9章「あなた専用AIチームを持つ未来」を読み返すと、AIに先回りして助けてもらう未来像がつかみやすくなります。'
  },
  'じっくり理解するタイプ｜おすすめAI：Claude Code': {
    shortType: 'じっくり理解するタイプ',
    recommendedAI: 'Claude Code',
    reason: 'すぐに進めるよりも、「ちゃんと理解してから進めたい」という気持ちが強いタイプです。説明が丁寧なAIや、間違いを確認してくれるAIと相性が良いです。',
    strength: '「理解する → 確認する → 安心して進める」この流れがあなたの強みです。',
    firstStep: '何かを始める前に、AIへ「この進め方で大丈夫？」と相談してみましょう。',
    review: '第7章「初心者が99％ハマる失敗 AIが自信満々に間違える理由」を読み返すと、AIと安全に付き合うコツがかなり分かります。'
  },
  'AIに仕事を任せるタイプ｜おすすめAI：Devin＋OpenHands': {
    shortType: 'AIに仕事を任せるタイプ',
    recommendedAI: 'Devin＋OpenHands',
    reason: '細かい作業をAIに任せ、全体の流れや完成形を見ながら進めるのが得意なタイプです。',
    strength: '「目的を決める → 任せる → 確認する」この流れがあなたの強みです。',
    firstStep: 'まずはAIに任せたい作業を1つ決めて、「目的」「完成イメージ」「確認してほしいこと」を書き出してみましょう。',
    review: '第5章「自律AIエージェントの世界」と第9章「あなた専用AIチームを持つ未来」を読み返すと、AIに仕事を任せるイメージが具体的になります。'
  }
};

const LEGACY_RESULT_MAP = {
  'ChatGPT/Codexタイプ': '相談しながら進めるタイプ｜おすすめAI：ChatGPT＋Codex',
  'Cursorタイプ': '手を動かして作るタイプ｜おすすめAI：Cursor',
  'Windsurfタイプ': '流れに乗って進めるタイプ｜おすすめAI：Windsurf',
  'Claude Codeタイプ': 'じっくり理解するタイプ｜おすすめAI：Claude Code',
  'Devin/OpenHandsタイプ': 'AIに仕事を任せるタイプ｜おすすめAI：Devin＋OpenHands'
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, consent, resultType, answers, inflow } = req.body || {};
    if (!name || !email || !consent || !resultType || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const normalizedResultType = LEGACY_RESULT_MAP[resultType] || resultType;
    const content = RESULT_CONTENT[normalizedResultType] || RESULT_CONTENT['相談しながら進めるタイプ｜おすすめAI：ChatGPT＋Codex'];
    const now = new Date().toISOString();
    const answersText = answers.map((a, i) => `Q${i + 1}:${a.answer}`).join(' / ');

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'あなたに向いているAI診断結果',
      text:
`【診断結果】\n\n${content.shortType}\n\nおすすめAI：\n${content.recommendedAI}\n\n【向いている理由】\n\n${content.reason}\n\n${content.strength}\n\n【最初の一歩】\n\n${content.firstStep}\n\n【本の復習ポイント】\n\n${content.review}\n\n━━━━━━━━━━\n\n次のおすすめ\n\nINNER COMPASS\n\nAIコーチングで\n\n・悩み整理\n・目標設定\n・セルフコーチング\n・毎日の星座占い\n\n総合運／恋愛運／仕事運／金運\n\n今日のヒントも無料でチェックできます。\n\nhttps://coacing-app.vercel.app/\n\n━━━━━━━━━━\n\n配信停止をご希望の場合は、\nこのメールに「配信停止希望」と返信してください。`
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
        values: [[now, name, email, normalizedResultType, answersText, inflow || 'Kindle読者特典', consent ? '同意あり' : '同意なし']]
      }
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', detail: e.message });
  }
};
