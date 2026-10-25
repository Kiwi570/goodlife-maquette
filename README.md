# Good Life Sport's Club — maquette « Club plein air »

Maquette de refonte (proposition), site statique sans étape de construction, prêt pour Vercel.

## Pages
- `index.html` — accueil
- `planning.html` — planning de démonstration et réservation simulée
- `tarifs.html` — tarifs, calculateur et Espace Performance

## Modifier le contenu
Tout le contenu variable est dans `assets/js/data.js` : horaires, cours (durées, prix, descriptions), planning, formules coaching, abonnements, informations à confirmer.
Le planning actuel est **illustratif** (`planningDemo: true`) : remplacer les créneaux par le vrai planning du club.

## Remplacer une image
Chaque image existe en deux largeurs : `assets/img/<nom>-<largeur>.webp`
(16:9 → 960 et 1920 · 9:16 → 540 et 1080 · 4:5 et 1:1 → 600 et 1200).
Les visuels marqués « Visuel provisoire » ou « Ambiance provisoire » sont dessinés en code et attendent les images Grok ou de vraies photos.
Quand une vraie photo remplace un visuel d'ambiance, retirer la mention `chip--ambiance` correspondante dans le HTML.

## Technique
GSAP 3 (ScrollTrigger, SplitText, Flip), Lenis, OGL (rideau de feuilles WebGL), polices Bricolage Grotesque et Inter Tight (SIL OFL), tout hébergé avec le site.
Mode calme (bouton toujours visible, et automatique si « réduire les animations » est activé) ; version sans WebGL automatique.
Paramètres de test : `?calme=1` et `?nogl=1`.

La maquette est volontairement non indexée (`robots.txt`, balise `noindex`, en-tête `X-Robots-Tag`) pour ne pas concurrencer le site officiel. À retirer au moment d'une mise en ligne officielle.
