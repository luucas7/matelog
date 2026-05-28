# TeaLog

Assistant d'infusion brutaliste, fichier unique. Calcule le temps d'attente pour que l'eau bouillie refroidisse jusqu'a la temperature cible de ton the (loi de Newton), puis lance le timer d'infusion.

## Utilisation

1. Ouvrir `index.html` dans un navigateur (Chrome ou Firefox sur Android, n'importe quel navigateur moderne sur desktop).
2. Ajouter en favori. Pour acces rapide sur Android: menu navigateur > Ajouter a l'ecran d'accueil.
3. Choisir une categorie de the ou un the perso. Confirmer le volume d'eau a bouillir. Demarrer.

L'ecran de preparation affiche la quantite de feuilles a utiliser (en grammes), calculee depuis le dosage du the et le volume. Elle suit automatiquement le volume quand tu le changes.

## Historique et notation

A la fin de chaque infusion, noter le resultat: TROP AMER, PARFAIT ou FADE. Le bouton HISTORIQUE sur l'accueil affiche:
- Une analyse par the des qu'il a au moins 3 infusions notees, avec un verdict (souvent amer, souvent fade, bien calibre) et un conseil de correction.
- Le journal chronologique des dernieres infusions.

Logique: amer = eau trop chaude (baisse la temperature ou le temps), fade = eau trop froide (monte la temperature ou le temps).

## Premier reglage

Aller dans PARAMETRES et regler:
- **Temperature ambiante** de la piece (defaut 20C, ajuste selon la saison)
- **Diametre d'ouverture** de ta bouilloire en cm
- **Alpha** (facteur de calibration du refroidissement)

Pour calibrer alpha precisement, aller dans CALIBRER ALPHA et suivre le protocole (necessite un thermometre culinaire).

Sans thermometre, valeurs indicatives par type de bouilloire:
- Plastique entree de gamme (Tefal Uno KO1508): ~0.007
- Plastique standard: ~0.010
- Inox ouverture large: ~0.013

Si tes thes sont systematiquement amers, baisse alpha. S'ils sont fades, monte alpha.

## Sauvegarde

Le bouton EXPORT JSON dans les parametres telecharge un fichier avec tous tes thes, contenants, reglages et historique. Garde-le precieusement si tu changes de telephone, parce que les donnees sont stockees dans le navigateur uniquement.

Le bouton IMPORT JSON recharge un fichier exporte. Il ecrase les donnees actuelles (restauration complete), donc utile pour migrer vers un nouveau telephone ou revenir a une sauvegarde.

## Documentation technique

Voir `CLAUDE.md` pour l'architecture, le modele physique et les conventions de developpement.
