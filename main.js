const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client();

// Seguimiento del progreso de los usuarios
const userProgress = {};
const formResponses = {};

// Información de departamentos y opciones
const departments = {
    "1": "Quindío",
    "2": "Anserma Nuevo Valle",
    "3": "Medellin La Eterna primavera"
};

const departmentMenus = {
    "Quindío": {
        info: "Quindío es conocido por su cultura cafetera y hermosos paisajes.",
        photo: './img/2021.jpg',
        product: "Vuelo destacado: Parapente sobre el paisaje cafetero - $100 USD.",
        location: { lat: 4.541, lon: -75.666 } // Coordenadas de ejemplo
    },
    "Valle": {
        info: "Valle del Cauca es famoso por su salsa, turismo y cultivos de caña.",
        photo: './images/valle.jpg',
        product: "Vuelo destacado: Parapente sobre los campos de caña - $80 USD.",
        location: { lat: 3.451, lon: -76.532 } // Coordenadas de ejemplo
    },
    "Antioquia": {
        info: "Antioquia destaca por su arquitectura, cultura paisa y montañas.",
        photo: './images/antioquia.jpg',
        product: "Vuelo destacado: Parapente sobre Medellín - $120 USD.",
        location: { lat: 6.251, lon: -75.564 } // Coordenadas de ejemplo
    }
};

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Escanea el código QR con tu aplicación de WhatsApp.');
});

client.on('ready', () => {
    console.log('El cliente está listo.');
});

client.on('message', async message => {
    const userId = message.from;
    const msgBody = message.body.toLowerCase();

    // Inicializar progreso del usuario
    if (!userProgress[userId]) {
        userProgress[userId] = { step: "start", department: null };
        formResponses[userId] = {};
    }

    const userState = userProgress[userId];

    // Saludo inicial
    if (msgBody.includes("hola")) {
        userState.step = "menu";
        const welcomeMessage = `
       
        ¡Hola! Bienvenid@s 😊 mucho gusto soy Juan David de aventura 🪂parapente

        1️⃣ Quindío
        2️⃣ Valle Anserma Nuevo 
        3️⃣ Antioquia Medellín 

        Escribe el número de la opción para elegir.
        🔙 *Atrás*: Volver al menú anterior.
        ❌ *Salir*: Salir del flujo.
        `;
        client.sendMessage(userId, welcomeMessage);
        return;
    }

    // Salir del flujo
    if (msgBody.includes("salir")) {
        delete userProgress[userId];
        delete formResponses[userId];
        client.sendMessage(userId, "Has salido del flujo. Escribe 'hola' si deseas empezar de nuevo.");
        return;
    }

    // Ir atrás
    if (msgBody.includes("atrás")) {
        if (userState.step === "sub-menu") {
            userState.step = "menu";
            const menuMessage = `
            Selecciona uno de los siguientes destinos:
            1️⃣ Quindío
            2️⃣ Valle
            3️⃣ Antioquia
            `;
            client.sendMessage(userId, menuMessage);
        } else if (userState.step === "form") {
            userState.step = "sub-menu";
            const department = userState.department;
            const submenuMessage = `
            Has regresado al menú de ${department}.
            1️⃣ Información.
            2️⃣ Fotos.
            3️⃣ Cotizar vuelo.
            4️⃣ Comprar vuelo.
            5️⃣ Ubicación.
            🔙 *Atrás*: Volver al menú principal.
            ❌ *Salir*: Salir del flujo.
            `;
            client.sendMessage(userId, submenuMessage);
        } else {
            client.sendMessage(userId, "No puedes ir más atrás. Escribe 'salir' para salir del flujo.");
        }
        return;
    }

    // Menú principal
    if (userState.step === "menu") {
        if (departments[msgBody]) {
            userState.department = departments[msgBody];
            userState.step = "sub-menu";

            const submenuMessage = `
            Has seleccionado: ${departments[msgBody]}.
            1️⃣ Información.
            2️⃣ Fotos.
            3️⃣ Cotizar vuelo.
            4️⃣ Comprar vuelo.
            5️⃣ Ubicación.

            🔙 *Atrás*: Volver al menú principal.
            ❌ *Salir*: Salir del flujo.
            `;
            client.sendMessage(userId, submenuMessage);
        } else {
            client.sendMessage(userId, "Por favor selecciona una opción válida (1, 2 o 3).");
        }
        return;
    }

    // Submenú
    if (userState.step === "sub-menu") {
        const department = userState.department;
        const menuOptions = departmentMenus[department];

        if (msgBody === "1") {
            client.sendMessage(userId, menuOptions.info);
        } else if (msgBody === "2") {
            const media = MessageMedia.fromFilePath(menuOptions.photo);
            client.sendMessage(userId, media, { caption: `Foto de ${department}` });
        } else if (msgBody === "3") {
            client.sendMessage(userId, menuOptions.product);
        } else if (msgBody === "4") {
            userState.step = "form";
            client.sendMessage(userId, "¡Vamos a llenar el formulario para comprar tu vuelo! ¿Cuál es tu nombre?");
        } else if (msgBody === "5") {
            const location = menuOptions.location;
            const mapsLink = `https://www.google.com/maps?q=${location.lat},${location.lon}`;
            client.sendMessage(userId, `Esta es la ubicación aproximada de ${department}: ${mapsLink}`);
        } else {
            client.sendMessage(userId, "Por favor selecciona una opción válida (1, 2, 3, 4 o 5).");
        }
        return;
    }

    // Formulario
    if (userState.step === "form") {
        const responses = formResponses[userId];

        if (!responses.name) {
            responses.name = message.body;
            client.sendMessage(userId, "¿Cuál es tu cédula o número de pasaporte?");
        } else if (!responses.id) {
            responses.id = message.body;
            client.sendMessage(userId, "¿Cuál es tu correo electrónico?");
        } else if (!responses.email) {
            responses.email = message.body;

            // Generar tarjeta resumen
            const summary = `
            🎉 ¡Formulario completado! 🎉
            📝 *Resumen de compra*:
            Nombre: ${responses.name}
            Cédula/Pasaporte: ${responses.id}
            Correo electrónico: ${responses.email}

            Gracias por tu interés en nuestros vuelos en parapente. 😊
            `;
            client.sendMessage(userId, summary);

            // Reiniciar progreso del usuario
            delete userProgress[userId];
            delete formResponses[userId];
        }
        return;
    }

    // Mensaje por defecto
    client.sendMessage(userId, 'Escribe "hola" para comenzar, "atrás" para retroceder, o "salir" para salir.');
});

client.initialize();
