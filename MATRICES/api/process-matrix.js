// Cambiar la línea 1:
import fetch from 'node-fetch';
// Por:
// Eliminar import fetch - usar fetch nativo de Node.js 18+

// También cambiar el modelo:
model: 'moonshot-v1-8k',
// Por:
model: 'kimi-latest',

// Función para validar matriz
function validateMatrix(matrix) {
  if (!matrix || !Array.isArray(matrix) || matrix.length === 0) {
    return { valid: false, error: 'La matriz debe ser un array no vacío' };
  }
  
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  if (cols === 0) {
    return { valid: false, error: 'La matriz no puede tener columnas vacías' };
  }
  
  for (let i = 0; i < rows; i++) {
    if (!Array.isArray(matrix[i]) || matrix[i].length !== cols) {
      return { valid: false, error: 'Todas las filas deben tener el mismo número de columnas' };
    }
    
    for (let j = 0; j < cols; j++) {
      if (!Number.isFinite(matrix[i][j])) {
        return { valid: false, error: `Valor inválido en posición [${i}][${j}]` };
      }
    }
  }
  
  return { valid: true };
}

// Función para sanitizar operación
function sanitizeOperation(operation) {
  if (!operation || typeof operation !== 'string') {
    return '';
  }
  
  return operation
    .trim()
    .toLowerCase()
    .replace(/[<>\"'&]/g, '')
    .substring(0, 100);
}

// Lista de operaciones válidas para sugerencias
const validOperations = [
  'inversa', 'determinante', 'traspuesta', 'adjunta', 'rango',
  'eigenvalores', 'eigenvectores', 'triangular superior', 'triangular inferior',
  'descomposición lu', 'descomposición qr', 'norma', 'traza'
];

export default async function handler(req, res) {
  console.log('=== INICIO HANDLER ===');
  console.log('Método:', req.method);
  console.log('Origin:', req.headers.origin);
  console.log('Headers recibidos:', Object.keys(req.headers));
  console.log('Body recibido:', req.body);
  
  // Configurar CORS
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('Manejando preflight OPTIONS request');
    return res.status(200).end();
  }

  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    console.log('Método no permitido:', req.method);
    return res.status(405).json({ 
      error: 'Método no permitido',
      allowedMethods: ['POST'] 
    });
  }

  try {
    // Extraer datos del body
    const { matrix, operation } = req.body;
    
    // Validar matriz
    const matrixValidation = validateMatrix(matrix);
    if (!matrixValidation.valid) {
      return res.status(400).json({ 
        error: 'Matriz inválida', 
        details: matrixValidation.error 
      });
    }

    // Sanitizar operación
    const sanitizedOperation = sanitizeOperation(operation);
    
    // Verificar configuración de API
    const { KIMI_API_KEY, API_ENDPOINT } = process.env;
    
    console.log('Variables de entorno:', {
      hasKimiKey: !!KIMI_API_KEY,
      kimiKeyLength: KIMI_API_KEY ? KIMI_API_KEY.length : 0,
      hasEndpoint: !!API_ENDPOINT,
      endpoint: API_ENDPOINT
    });
    
    if (!KIMI_API_KEY || !API_ENDPOINT) {
      console.error('Variables de entorno faltantes:', { 
        hasKey: !!KIMI_API_KEY, 
        hasEndpoint: !!API_ENDPOINT
      });
      return res.status(500).json({ 
        error: 'Configuración de API no encontrada',
        details: `Faltan variables: ${!KIMI_API_KEY ? 'KIMI_API_KEY ' : ''}${!API_ENDPOINT ? 'API_ENDPOINT' : ''}`,
        suggestion: 'Contacta al administrador para configurar las variables de entorno' 
      });
    }

    // Crear prompt
    let prompt;
    if (sanitizedOperation && sanitizedOperation.trim() !== '') {
      prompt = `Como experto en álgebra lineal, resuelve esta operación de matriz paso a paso:\n\nMATRIZ:\n${JSON.stringify(matrix)}\n\nOPERACIÓN SOLICITADA: ${sanitizedOperation}\n\nPor favor proporciona:\n1. Verificación de si la operación es posible\n2. Procedimiento paso a paso detallado\n3. Resultado final (matriz o valor numérico)\n4. Interpretación matemática del resultado\n\nSi la operación no es posible, explica claramente por qué y sugiere alternativas.\n\nFormato la respuesta de manera clara y educativa.`;
    } else {
      prompt = `Analiza esta matriz y proporciona sus propiedades matemáticas principales:\n\nMATRIZ:\n${JSON.stringify(matrix)}\n\nIncluye:\n- Dimensiones y tipo de matriz\n- Determinante (si es cuadrada)\n- Rango\n- Si es simétrica, antisimétrica, diagonal, etc.\n- Propiedades especiales\n- Sugerencias de operaciones útiles\n\nPresenta la información de forma organizada y educativa.`;
    }

    // Realizar petición a la API con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
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
          max_tokens: 1500,
          temperature: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error de API LLM:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let userMessage = 'Error en el servicio de IA';
        let userSuggestion = 'Intenta de nuevo en unos momentos';
        
        if (response.status === 401) {
          userMessage = 'API Key inválida o expirada';
          userSuggestion = 'Contacta al administrador para verificar la configuración';
        } else if (response.status === 429) {
          userMessage = 'Límite de solicitudes excedido';
          userSuggestion = 'Espera un momento antes de intentar de nuevo';
        } else if (response.status >= 500) {
          userMessage = 'El servicio de IA está temporalmente no disponible';
          userSuggestion = 'Intenta de nuevo en unos minutos';
        }
        
        return res.status(502).json({ 
          error: userMessage,
          details: `Código de estado: ${response.status}`,
          suggestion: userSuggestion,
          technical_details: errorText
        });
      }

      const data = await response.json();
      const llmResponse = data.choices?.[0]?.message?.content;
      
      if (!llmResponse) {
        console.error('Respuesta vacía del LLM:', data);
        return res.status(502).json({ 
          error: 'El servicio de IA no proporcionó una respuesta válida',
          details: 'La respuesta del modelo fue vacía o malformada',
          suggestion: 'Intenta reformular tu consulta o usar una operación más simple'
        });
      }

      // Respuesta exitosa
      const successResponse = { 
        matrix, 
        operation: sanitizedOperation || 'análisis general',
        llm_response: llmResponse,
        suggestions: sanitizedOperation ? [] : validOperations.slice(0, 5),
        timestamp: new Date().toISOString()
      };
      
      console.log('=== RESPUESTA EXITOSA ===');
      console.log('Response keys:', Object.keys(successResponse));
      console.log('LLM response length:', llmResponse.length);
      
      res.status(200).json(successResponse);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return res.status(408).json({ 
          error: 'La operación tardó demasiado tiempo',
          details: 'Timeout después de 30 segundos',
          suggestion: 'Intenta con una matriz más pequeña o una operación más simple'
        });
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Error al procesar la matriz:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    if (error.name === 'AbortError') {
      return res.status(408).json({ 
        error: 'Timeout en la consulta',
        details: 'La operación tardó demasiado tiempo',
        suggestion: 'Intenta con una matriz más pequeña o una operación más simple'
      });
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Servicio de IA no disponible',
        details: 'No se puede conectar con el servicio externo',
        suggestion: 'Intenta de nuevo más tarde'
      });
    }

    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error inesperado',
      suggestion: 'Si el problema persiste, contacta al soporte técnico'
    });
  }
}