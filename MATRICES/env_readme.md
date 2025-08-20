# Calculadora de Matrices con IA

Una aplicación web moderna para realizar cálculos de matrices utilizando inteligencia artificial con el modelo Kimi K2.

## 🚀 Características

- **Interfaz intuitiva**: Creación y edición fácil de matrices hasta 10x10
- **IA integrada**: Procesamiento inteligente de operaciones matemáticas
- **Operaciones completas**: Inversa, determinante, eigenvalores, descomposición LU, y más
- **Responsive**: Funciona en dispositivos móviles y desktop
- **Accesible**: Cumple estándares de accesibilidad web
- **Tiempo real**: Validación y sugerencias en tiempo real

## 📋 Operaciones Soportadas

- ✅ Inversa de matriz
- ✅ Determinante
- ✅ Matriz traspuesta
- ✅ Matriz adjunta
- ✅ Rango de matriz
- ✅ Eigenvalores y eigenvectores
- ✅ Triangulación (superior/inferior)
- ✅ Descomposición LU
- ✅ Normas de matriz
- ✅ Traza
- ✅ Y muchas más...

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18.0.0 o superior
- Cuenta en Vercel (para deployment)
- API Key de Kimi K2

### Configuración local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/usuario/matrix-calculator-ai.git
   cd matrix-calculator-ai
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Copiar archivo de ejemplo
   cp .env.example .env.local
   
   # Editar .env.local con tus credenciales
   KIMI_API_KEY=tu-api-key-aqui
   API_ENDPOINT=https://api.moonshot.cn/v1
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en navegador**
   ```
   http://localhost:3000
   ```

## 🔧 Variables de Entorno

Crear un archivo `.env.local` con las siguientes variables:

```env
# API Key de Kimi K2 (requerido)
KIMI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Endpoint de la API (requerido)
API_ENDPOINT=https://api.moonshot.cn/v1

# Entorno (opcional)
NODE_ENV=development
```

## 🚀 Deployment en Vercel

1. **Conectar repositorio a Vercel**
   - Ir a [vercel.com](https://vercel.com)
   - Importar proyecto desde GitHub

2. **Configurar variables de entorno en Vercel**
   - En el dashboard de Vercel → Settings → Environment Variables
   - Agregar `KIMI_API_KEY` y `API_ENDPOINT`

3. **Deploy automático**
   - Cada push a main desplegará automáticamente

## 📱 Uso

### Crear una matriz
1. Especifica las dimensiones (filas × columnas)
2. Haz clic en "Crear matriz"
3. Llena los valores manualmente o usa "Llenar Aleatorio"
4. Guarda la matriz

### Realizar operaciones
1. Escribe la operación deseada (ej: "inversa", "determinante")
2. Usa las sugerencias automáticas para mayor precisión
3. Haz clic en "Calcular"
4. Revisa el resultado detallado paso a paso

### Atajos de teclado
- **Flechas**: Navegar entre celdas de la matriz
- **Enter**: Avanzar a la siguiente celda
- **Tab**: Navegar por formularios
- **Ctrl+Enter**: Ejecutar cálculo

## 🔍 Ejemplos de Operaciones

```text
# Operaciones básicas
- "inversa"
- "determinante" 
- "traspuesta"
- "rango"

# Operaciones avanzadas
- "eigenvalores"
- "descomposición lu"
- "triangular superior"
- "forma escalonada reducida"

# Análisis
- "es simétrica"
- "es ortogonal"
- "norma frobenius"
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test

# Linting
npm run lint
```

## 📊 Estructura del Proyecto

```
matrix-calculator-ai/
├── api/
│   └── process-matrix.js    # Endpoint backend
├── index.html              # Frontend principal
├── styles.css              # Estilos CSS
├── package.json            # Configuración npm
├── vercel.json             # Configuración Vercel
├── .env.example            # Ejemplo variables entorno
└── README.md               # Documentación
```

## 🐛 Solución de Problemas

### Error: "Configuración de API no encontrada"
- Verifica que `KIMI_API_KEY` y `API_ENDPOINT` estén configurados
- En Vercel, revisa las Environment Variables

### Error: "Timeout en la consulta"
- La matriz puede ser muy grande
- Intenta con dimensiones menores
- Verifica la conexión a internet

### Error: "Matriz inválida"
- Asegúrate de que todos los campos contengan números
- No dejes celdas vacías
- Verifica que no haya caracteres especiales

### Problemas de rendimiento
- Las matrices 8×8 o mayores pueden ser lentas
- Usa matrices 5×5 o menores para mejor experiencia
- El procesamiento depende de la respuesta de la IA

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si encuentras algún problema:

1. Revisa la sección de [Issues](https://github.com/usuario/matrix-calculator-ai/issues)
2. Crea un nuevo issue con detalles del problema
3. Incluye información sobre:
   - Navegador y versión
   - Dimensiones de la matriz
   - Operación que intentabas realizar
   - Mensaje de error completo

## 🎯 Roadmap

### Próximas características
- [ ] Soporte para operaciones con múltiples matrices
- [ ] Exportar resultados a PDF
- [ ] Modo offline con cálculos básicos
- [ ] Historial de operaciones
- [ ] Plantillas de matrices comunes
- [ ] Gráficos de eigenvalores
- [ ] API pública para desarrolladores

### Mejoras técnicas
- [ ] Tests automatizados
- [ ] Cache de resultados
- [ ] Optimización de rendimiento
- [ ] PWA (Progressive Web App)
- [ ] Modo oscuro
- [ ] Internacionalización (i18n)

---

**Desarrollado con ❤️ por Manuel Carrasco Garcia**