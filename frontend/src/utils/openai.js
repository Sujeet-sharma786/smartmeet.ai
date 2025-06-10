import axios from 'axios';

export const generateFromTranscript = async (prompt, transcript) => {

  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  console.log('openai api key: ',apiKey)
  const systemPrompt = `${prompt}\n\nTranscript:\n${transcript}`;
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      max_tokens: 512,
      temperature: 0.5,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content.trim();
};

