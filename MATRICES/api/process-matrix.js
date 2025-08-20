const fetch = require('node-fetch');

export default async function handler(req, res) {
  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Extraer la matriz y operación del cuerpo de la solicitud
  const { matrix, operation } = req.body;
  
  // Validación básica
  if (!matrix || !Array.isArray(matrix) || !matrix.every(row => Array.isArray(row) && row.every(Number.isFinite))) {
    return res.status(400).json({ error: 'Matriz inválida. Asegúrate de que contenga solo números válidos.' });
  }

  // Obtener variables de entorno
  const { KIMI_API_KEY, API_ENDPOINT } = process.env;
  if (!KIMI_API_KEY || !API_ENDPOINT) {
    return res.status(500).json({ error: 'Configuración de API no encontrada. Contacta al administrador.' });
  }

  try {
    // Enviar la matriz al LLM Kimi K2
    const response = await fetch(`${API_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2',
        messages: [{ role: 'user', content: `Procesar esta matriz: ${JSON.stringify(matrix)}` }],
        max_tokens: 500,
      })
    });

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.statusText}`);
    }

    const data = await response.json();
    const llmResponse = data.choices?.[0]?.message?.content || 'No se obtuvo respuesta del LLM';

    // Devolver la matriz y la respuesta del LLM
    res.status(200).json({ matrix, llm_response: llmResponse });
  } catch (error) {
    console.error('Error al procesar la matriz:', error);
    res.status(500).json({ error: 'Error al procesar la matriz con el LLM.' });
  }
}