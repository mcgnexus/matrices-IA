import fetch from 'node-fetch';

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
    // Crear prompt con la operación específica
    let prompt = '';
    if (operation && operation.trim() !== '') {
      prompt = `Dada la siguiente matriz: ${JSON.stringify(matrix)}\n\nPor favor, calcula la siguiente operación: ${operation}\n\nProporciona:\n1. El resultado paso a paso\n2. La matriz resultante (si aplica)\n3. Explicación del procedimiento\n\nSi la operación no es posible (por ejemplo, matriz singular para inversa), explica por qué.`;
    } else {
      prompt = `Analiza esta matriz: ${JSON.stringify(matrix)}\n\nProporciona información relevante sobre sus propiedades (determinante, rango, si es simétrica, etc.)`;
    }

    // Enviar al LLM Kimi K2
    const response = await fetch(`${API_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [{ 
          role: 'user', 
          content: prompt 
        }],
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de API:', response.status, errorText);
      throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const llmResponse = data.choices?.[0]?.message?.content || 'No se obtuvo respuesta del LLM';

    // Devolver la matriz, operación y respuesta del LLM
    res.status(200).json({ 
      matrix, 
      operation: operation || 'análisis general',
      llm_response: llmResponse 
    });
  } catch (error) {
    console.error('Error al procesar la matriz:', error);
    res.status(500).json({ 
      error: 'Error al procesar la matriz con el LLM.',
      details: error.message 
    });
  }
}
