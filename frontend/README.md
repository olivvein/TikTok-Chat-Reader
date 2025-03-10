# TikTok Chat Reader - Frontend

Ce projet est une interface React moderne pour le lecteur de chat TikTok LIVE. Il utilise Vite comme outil de build et Tailwind CSS pour le styling.

## Fonctionnalités

- Interface utilisateur moderne et responsive
- Affichage en temps réel des messages du chat
- Affichage des cadeaux reçus
- Statistiques du stream
- Modération de contenu avec IA
- Gestion des listes d'utilisateurs (amis et indésirables)
- Notifications pour les mentions et les messages signalés
- Support pour les réponses générées par IA (OpenAI ou Ollama)

## Prérequis

- Node.js 16+
- npm ou yarn

## Installation

1. Cloner le dépôt
2. Installer les dépendances :

```bash
cd frontend
npm install
```

## Configuration de Tailwind CSS

Ce projet utilise Tailwind CSS v4 qui nécessite la configuration particulière suivante:

```bash
# Installer le plugin PostCSS spécifique pour Tailwind CSS v4
npm install -D @tailwindcss/postcss
```

Le fichier `postcss.config.js` doit être configuré comme suit:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

## Développement

Pour lancer le serveur de développement :

```bash
npm run dev
```

L'application sera disponible à l'adresse [http://localhost:5173](http://localhost:5173).

## Production

Pour construire l'application pour la production :

```bash
npm run build
```

Les fichiers générés seront disponibles dans le dossier `dist`.

## Technologies utilisées

- React 18
- Vite
- Tailwind CSS 4
- Socket.IO Client
- Axios

## Licence

MIT
