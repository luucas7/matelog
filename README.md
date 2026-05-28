# MateLog

Assistant d'infusion brutaliste, fichier unique. Calcule le temps d'attente pour que l'eau bouillie refroidisse jusqu'à la température cible de ton thé (loi de Newton), puis lance le timer d'infusion.

En ligne : **https://luucas7.github.io/matelog/**

## Utilisation

1. Ouvrir l'URL ci-dessus dans un navigateur (ou `index.html` en local).
2. Ajouter en favori. Pour accès rapide sur Android : menu navigateur > Ajouter à l'écran d'accueil.
3. Choisir une catégorie de thé ou un thé perso. Confirmer le volume d'eau à bouillir. Démarrer.

L'écran de préparation affiche la quantité de feuilles à utiliser (en grammes), calculée depuis le dosage du thé et le volume. Elle suit automatiquement le volume quand tu le changes.

## Historique et notation

À la fin de chaque infusion, noter le résultat : TROP AMER, PARFAIT ou FADE. Le bouton HISTORIQUE sur l'accueil affiche :
- Une analyse par thé dès qu'il a au moins 3 infusions notées, avec un verdict (souvent amer, souvent fade, bien calibré) et un conseil de correction.
- Le journal chronologique des dernières infusions.

Logique : amer = eau trop chaude (baisse la température ou le temps), fade = eau trop froide (monte la température ou le temps).

## Premier réglage

Aller dans PARAMETRES et régler :
- **Température ambiante** de la pièce (défaut 20°C, ajuste selon la saison)
- **Diamètre d'ouverture** de ta bouilloire en cm
- **Alpha** (facteur de calibration du refroidissement)

Pour calibrer alpha précisément, aller dans CALIBRER ALPHA et suivre le protocole (nécessite un thermomètre culinaire).

Sans thermomètre, valeurs indicatives par type de bouilloire :
- Plastique entrée de gamme (Tefal Uno KO1508) : ~0.007
- Plastique standard : ~0.010
- Inox ouverture large : ~0.013

Si tes thés sont systématiquement amers, baisse alpha. S'ils sont fades, monte alpha.

## Notifications

Sur l'URL hébergée (HTTPS), tu peux activer les notifications système dans PARAMETRES > NOTIFICATIONS : utile sur PC pour être prévenu même si l'onglet est en arrière-plan. En complément, le titre de l'onglet clignote toujours quand le timer expire (aucune permission requise), et le bip audio + la vibration mobile sont actifs par défaut.

## Sauvegarde

Le bouton EXPORT JSON dans les paramètres télécharge un fichier avec tous tes thés, contenants, réglages et historique. Garde-le précieusement si tu changes de téléphone, parce que les données sont stockées dans le navigateur uniquement.

Le bouton IMPORT JSON recharge un fichier exporté. Il écrase les données actuelles (restauration complète), donc utile pour migrer vers un nouveau téléphone ou revenir à une sauvegarde.

## Documentation technique

Voir `CLAUDE.md` pour l'architecture, le modèle physique et les conventions de développement.
