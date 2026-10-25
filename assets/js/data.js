/* Good Life Sport's Club — fichier de données unique de la maquette.
   Sources : site actuel goodlifesportsclub.net (pages réservation, planning, coaching,
   espace performance, horaires & contact). Ce qui n'y figure pas est marqué « à compléter ». */
window.GL_DATA = {
  club: {
    nom: "Good Life Sport's Club",
    adresse: "104 route de Montauban",
    ville: "97190 Le Gosier, Guadeloupe",
    repere: "Juste à côté de la clinique de Choisy",
    tel: "05 90 03 15 50",
    mobile: "06 90 67 40 47",
    email: "goodlife.sc@hotmail.fr",
    facebook: "https://www.facebook.com/GoodLifeSportsClub/",
    instagram: "https://www.instagram.com/goodlifesportsclub/",
    instagramNom: "@goodlifesportsclub",
    reservationReelle: "https://www.goodlifesportsclub.net/reservations",
    itineraire: "https://www.google.com/maps/search/?api=1&query=104+route+de+Montauban+97190+Le+Gosier+Guadeloupe",
    itineraireApple: "https://maps.apple.com/?q=104+route+de+Montauban,+97190+Le+Gosier",
    fuseau: "America/Guadeloupe"
  },

  /* Horaires du site officiel (page Horaires & contact). Les annuaires en donnent d'autres : à confirmer. */
  horaires: [
    { jour: "Dimanche", court: "Dim", plages: [] },
    { jour: "Lundi", court: "Lun", plages: [["08:30", "12:00"], ["15:30", "20:00"]] },
    { jour: "Mardi", court: "Mar", plages: [["08:30", "12:00"], ["15:30", "20:00"]] },
    { jour: "Mercredi", court: "Mer", plages: [["08:30", "12:00"], ["16:00", "20:00"]] },
    { jour: "Jeudi", court: "Jeu", plages: [["08:30", "12:00"], ["15:30", "20:00"]] },
    { jour: "Vendredi", court: "Ven", plages: [["08:30", "12:00"], ["16:00", "20:00"]] },
    { jour: "Samedi", court: "Sam", plages: [["09:00", "12:00"]] }
  ],

  categories: [
    { id: "tous", nom: "Tous les cours" },
    { id: "cardio", nom: "Cardio & H.I.I.T" },
    { id: "renfo", nom: "Renforcement" },
    { id: "zen", nom: "Zen & souplesse" },
    { id: "libre", nom: "Accès libre" }
  ],

  /* Cours, durées et prix : page Réservation du site actuel. Descriptions marquées site = texte du club. */
  cours: [
    { id: "gym-douce", nom: "Gym douce", duree: 60, prix: 10, cat: "zen", img: "cours-gym-douce-4x5", icone: "balance",
      desc: "Mobilité, étirements et renforcement tout en douceur." },
    { id: "kettlebells", nom: "Bars & kettlebells", duree: 60, prix: 10, cat: "renfo", img: "cours-kettlebells-4x5", icone: "kettlebell",
      desc: "Renforcement avec barres et kettlebells." },
    { id: "step-sculpt", nom: "Step & sculpt", duree: 60, prix: 10, cat: "cardio", img: "cours-step-4x5", icone: "step",
      desc: "Step chorégraphié, puis renforcement musculaire." },
    { id: "hiit", nom: "H.I.I.T & Fitworkout", duree: 60, prix: 10, cat: "cardio", img: "cours-hiit-4x5", icone: "chrono",
      desc: "Cours collectif qui allie plusieurs disciplines du fitness : LIA, cross training, CAF, pump.", site: true },
    { id: "abdos", nom: "Taille abdos", duree: 60, prix: 10, cat: "renfo", img: "cours-abdos-4x5", icone: "plank",
      desc: "Gainage et travail de la sangle abdominale." },
    { id: "sculpt", nom: "Sculpt", duree: 60, prix: 10, cat: "renfo", img: "cours-sculpt-4x5", icone: "dumbbell",
      desc: "Renforcement musculaire avec le poids du corps et des charges légères.", site: true },
    { id: "res", nom: "R.E.S", duree: 60, prix: 10, cat: "zen", img: "cours-res-4x5", icone: "balance",
      desc: "Renforcement, équilibre, souplesse.", site: true },
    { id: "pilates", nom: "Pilates", duree: 60, prix: 15, cat: "zen", img: "cours-pilates-4x5", icone: "ring",
      desc: "Gainage profond, posture et contrôle du mouvement, au sol." },
    { id: "yoga", nom: "Yoga", duree: 60, prix: 15, cat: "zen", img: "cours-yoga-4x5", icone: "sun",
      desc: "Postures, respiration et relâchement." },
    { id: "challenge", nom: "Le challenge du coach", duree: 45, prix: 10, cat: "cardio", img: "cours-challenge-4x5", icone: "rope",
      desc: "Cross training façon boot camp.", site: true },
    { id: "libre", nom: "Séance libre cardio & musculation", duree: 90, prix: 10, cat: "libre", img: "cours-libre-4x5", icone: "kettlebell",
      desc: "Accès cardio et musculation, à votre rythme.", site: true }
  ],

  /* PLANNING DE DÉMONSTRATION — créneaux illustratifs à remplacer par le vrai planning du club.
     jour : 1 = lundi … 6 = samedi. Chaque créneau finit avant la fermeture. */
  planningDemo: true,
  planning: [
    { jour: 1, h: "09:00", cours: "gym-douce" }, { jour: 1, h: "10:30", cours: "pilates" }, { jour: 1, h: "17:00", cours: "step-sculpt" }, { jour: 1, h: "18:00", cours: "hiit" }, { jour: 1, h: "19:00", cours: "abdos" },
    { jour: 2, h: "09:00", cours: "yoga" }, { jour: 2, h: "10:30", cours: "sculpt" }, { jour: 2, h: "17:00", cours: "kettlebells" }, { jour: 2, h: "18:00", cours: "challenge" }, { jour: 2, h: "19:00", cours: "res" },
    { jour: 3, h: "09:00", cours: "pilates" }, { jour: 3, h: "10:30", cours: "gym-douce" }, { jour: 3, h: "17:00", cours: "hiit" }, { jour: 3, h: "18:00", cours: "sculpt" }, { jour: 3, h: "19:00", cours: "yoga" },
    { jour: 4, h: "09:00", cours: "res" }, { jour: 4, h: "10:30", cours: "kettlebells" }, { jour: 4, h: "17:00", cours: "abdos" }, { jour: 4, h: "18:00", cours: "step-sculpt" }, { jour: 4, h: "19:00", cours: "pilates" },
    { jour: 5, h: "09:00", cours: "gym-douce" }, { jour: 5, h: "10:30", cours: "yoga" }, { jour: 5, h: "17:00", cours: "challenge" }, { jour: 5, h: "18:00", cours: "hiit" }, { jour: 5, h: "19:00", cours: "kettlebells" },
    { jour: 6, h: "09:00", cours: "hiit" }, { jour: 6, h: "10:30", cours: "pilates" }
  ],

  coaching: [
    { seances: 1, nom: "1 séance par semaine", prix: null },
    { seances: 2, nom: "2 séances par semaine", prix: null },
    { seances: 3, nom: "3 séances par semaine", prix: null }
  ],

  espacePerformance: { prixDes: 5, dureeMinH: 1, usages: ["Cross training", "H.I.I.T", "Boxe", "Tabata"] },

  abonnements: [
    { nom: "Abonnement mensuel", detail: "Accès salle et cours", prix: null },
    { nom: "Frais d'inscription", detail: "Une seule fois", prix: null }
  ],

  /* Infos vues uniquement dans des annuaires : jamais affichées comme des faits. */
  aConfirmer: ["Boutique nutrition sportive (vue sur l'enseigne)", "Plateau semi-ouvert", "Jardin extérieur", "Parking privé", "Sauna", "Moyens de paiement"]
};
