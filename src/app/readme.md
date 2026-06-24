🛒 Sistema de Gestión de Pedidos - Braedt Pro
Descripción del Proyecto
Sistema Web de gestión de pedidos mayoristas diseñado para optimizar el flujo de compra, control de inventario y aplicación de lógica de precios escalonados (tiers). Desarrollado para mejorar la eficiencia operativa en entornos de distribución de embutidos y productos de consumo masivo.
Este prototipo implementa una arquitectura moderna orientada a componentes, asegurando escalabilidad y una experiencia de usuario (UX) fluida.
🚀 Características Principales
•	Catálogo Dinámico: Filtrado y visualización de productos con datos reactivos.
•	Lógica de Negocio Avanzada: Cálculo automático de precios por volumen (Tiered Pricing) y detección de costos de envío según reglas de negocio.
•	Carrito Persistente: Gestión del estado de compra mediante localStorage para evitar la pérdida de datos en recargas.
•	Checkout Moderno: Flujo de pago optimizado con feedback visual en tiempo real.
•	UI/UX Responsiva: Adaptación completa a diferentes dispositivos utilizando Bootstrap 5.
🛠 Stack Tecnológico
•	Framework: Angular 22 (Standalone Components)
•	Lenguaje: TypeScript
•	Estilos: Bootstrap 5
•	Gestión de Estado: RxJS (BehaviorSubjects, Observables)
•	Tooling: Angular CLI, Node.js
🏗 Arquitectura del Proyecto
El proyecto sigue una estructura limpia y modular:
•	/core: Servicios, interceptores y modelos de datos globales.
•	/features: Lógica específica de negocio (Carrito, Catálogo, Checkout).
•	/shared: Componentes reutilizables (UI, Notificaciones, Cards).
📦 Instalación y Configuración
Prerrequisitos
•	Node.js (versión 20.x o superior)
•	Angular CLI (npm install -g @angular/cli)
Pasos para ejecución
	1.	Clonar el repositorio:
git clone [URL-DE-TU-REPOSITORIO]
cd [NOMBRE-DE-LA-CARPETA]

	2.	Instalar dependencias:
npm install

	3.	Ejecutar el servidor de desarrollo:
ng serve

	4.	Acceder a la aplicación:
Abre http://localhost:4200 en tu navegador.
📈 Roadmap (Futuras Mejoras)
•	[ ] Implementación de autenticación JWT (Auth0/Firebase).
•	[ ] Conexión a API REST (Node.js/Express) para persistencia en base de datos.
•	[ ] Dashboard de analítica para el administrador.
✒️ Autor
Grupo 4 - Desarrollo Web