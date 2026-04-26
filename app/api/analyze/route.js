const jokes = [
  "Why don't scientists trust atoms? Because they make up everything! 😄",
  "I told my computer I needed a break. Now it won't stop sending me Kit-Kat ads. 🍫",
  "Why did the programmer quit? Because they didn't get arrays. 😂",
  "I asked my dog what two minus two is. He said nothing. 🐶",
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
  "Why did the bicycle fall over? It was two-tired! 🚲",
  "Why did the math book look so sad? Because it had too many problems. 📚",
];

const quotes = [
  "Every storm runs out of rain. You've got this! 🌈",
  "Take a deep breath. You are stronger than you think. 💪",
  "This feeling is temporary. Better moments are on the way. ✨",
  "You didn't come this far to only come this far. Keep going! 🚀",
  "Even the darkest night will end and the sun will rise. 🌅",
  "Stars can't shine without darkness. You're a star! ⭐",
];

const facts = [
  "🧠 Your brain generates about 70,000 thoughts per day — most of them are positive!",
  "😊 Smiling, even when you don't feel like it, can actually lift your mood.",
  "🎵 Listening to music you love releases dopamine — nature's happiness chemical.",
  "🌿 Just 20 minutes in nature can significantly reduce stress hormones.",
  "🌬️ Taking 3 deep breaths activates the parasympathetic nervous system, calming you down.",
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Each entry: [model name, api version]
const MODELS = [
 ['gemini-2.5-flash','v1beta']
];

export async function POST(request) {
  try {
    const { image } = await request.json();
    if (!image) return Response.json({ error: 'No image provided' }, { status: 400 });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const apiKey = process.env.GOOGLE_API_KEY;

    const prompt = `
Analyze the facial expression in this image.

Classify the face as EXACTLY one emotion from:
happy, sad, angry, excited, neutral, stressed

Rules:
- Use neutral ONLY if no other emotion is reasonably detectable.
- Do NOT default to neutral as a safe answer.
- If a smile is visible -> happy.
- Furrowed brows/tension -> angry or stressed.
- Raised brows or surprise -> excited.
- Sad eyes/downturned lips -> sad.
- Pick the strongest visible emotion.

Respond ONLY valid JSON:

{
 "emotion":"happy",
 "confidence":85,
 "description":"reason for classification",
 "face_detected":true
}
`;

    const body = {
 contents: [{
   parts: [
     { text: prompt },
     {
       inlineData: {
         mimeType: "image/jpeg",
         data: base64Data
       }
     }
   ]
 }]
};

    let responseData = null;
    let lastError = null;

    for (const [model, version] of MODELS) {
      try {
        console.log(`Trying: ${model} (${version})`);
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.log(await res.text());
          lastError = data?.error?.message;
          continue;
        }

        console.log(`SUCCESS: ${model}`);
        responseData = data;
        break;
      } catch (e) {
        console.log(`${model} network error: ${e.message}`);
        lastError = e.message;
      }
    }

    if (!responseData) throw new Error(lastError || 'All models failed');

    const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Empty response');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);

    let suggestion = null;
    if (['stressed', 'sad', 'angry'].includes(parsed.emotion)) {
      const type = Math.floor(Math.random() * 3);
      if (type === 0) suggestion = { type: 'joke', content: getRandomItem(jokes) };
      else if (type === 1) suggestion = { type: 'quote', content: getRandomItem(quotes) };
      else suggestion = { type: 'fact', content: getRandomItem(facts) };
    }

    return Response.json({ ...parsed, suggestion });

  } catch (error) {
 return Response.json({
   emotion: "neutral",
   confidence: 50,
   description: "API unavailable",
   face_detected: true
 });
}
}
