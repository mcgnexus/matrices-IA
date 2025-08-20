import fetch from 'node-fetch';

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
  
  // Remover caracteres potencialmente peligrosos
  return operation
    .trim()
    .toLowerCase()
    .replace(/[<>\"'&]/g, '')
    .substring(0, 100); // Limitar longitud
}

// Lista de operaciones válidas para sugerencias
const validOperations = [
  'inversa', 'determinante', 'traspuesta', 'adjunta', 'rango',
  'eigenvalores', 'eigenvectores', 'triangular superior', 'triangular inferior',
  'descomposición lu', 'descomposición qr', 'norma', 'traza'
];

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
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
    if (!KIMI_API_KEY || !API_ENDPOINT) {
      console.error('Variables de entorno faltantes:', { 
        hasKey: !!KIMI_API_KEY, 
        hasEndpoint: !!API_ENDPOINT 
      });
      return res.status(500).json({ 
        error: 'Configuración de API no encontrada',
        suggestion: 'Contacta al administrador para configurar las variables de entorno' 
      });
    }

    // Crear prompt mejorado
    let prompt;
    if (sanitizedOperation && sanitizedOperation.trim() !== '') {
      prompt = `Como experto en álgebra lineal, resuelve esta operación de matriz paso a paso:

MATRIZ:
${JSON.stringify(matrix)}

OPERACIÓN SOLICITADA: ${sanitizedOperation}

Por favor proporciona:
1. Verificación de si la operación es posible
2. Procedimiento paso a paso detallado
3. Resultado final (matriz o valor numérico)
4. Interpretación matemática del resultado

Si la operación no es posible, explica claramente por qué y sugiere alternativas.

Formato la respuesta de manera clara y educativa.`;
    } else {
      prompt = `Analiza esta matriz y proporciona sus propiedades matemáticas principales:

MATRIZ:
${JSON.stringify(matrix)}

Incluye:
- Dimensiones y tipo de matriz
- Determinante (si es cuadrada)
- Rango
- Si es simétrica, antisimétrica, diagonal, etc.
- Propiedades especiales
- Sugerencias de operaciones útiles

Presenta la información de forma organizada y educativa.`;
    }

    // Realizar petición a la API con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

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
        temperature: 0.1 // Más determinístico para matemáticas
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
      
      return res.status(502).json({ 
        error: 'Error en el servicio de IA',
        details: `API respondió con estado ${response.status}`,
        suggestion: 'Intenta de nuevo en unos momentos'
      });
    }

    const data = await response.json();
    const llmResponse = data.choices?.[0]?.message?.content;
    
    if (!llmResponse) {
      console.error('Respuesta vacía del LLM:', data);
      return res.status(502).json({ 
        error: 'Respuesta vacía del servicio de IA',
        suggestion: 'Intenta reformular tu consulta'
      });
    }

    // Respuesta exitosa
    res.status(200).json({ 
      matrix, 
      operation: sanitizedOperation || 'análisis general',
      llm_response: llmResponse,
      suggestions: sanitizedOperation ? [] : validOperations.slice(0, 5),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al procesar la matriz:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Manejar diferentes tipos de error
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