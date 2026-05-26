# Checklist de test — Module Livreur (Phase 5B)

## Inscription livreur
- [ ] Accéder à `/register?role=DELIVERY_DRIVER`
- [ ] Remplir : nom, email, téléphone, ville/zone, moyen de transport, mot de passe
- [ ] Soumettre et vérifier que le compte est créé avec `driverStatus = PENDING`
- [ ] Vérifier que `vehicleType` et `city` sont bien stockés en base

## Validation admin
- [ ] Se connecter en admin
- [ ] Aller à `/admin/approvals` — le livreur doit apparaître en PENDING
- [ ] Aller à `/admin/drivers` — filtrer par PENDING
- [ ] Cliquer sur "Détail" d'un livreur — voir infos + livraisons
- [ ] Approuver le livreur (statut → AVAILABLE) — notification envoyée
- [ ] Rejeter un livreur (statut → REJECTED) — page `/driver/rejected` accessible
- [ ] Suspendre un livreur (statut → SUSPENDED) — page `/driver/suspended` accessible

## Espace livreur approuvé
- [ ] Se connecter en livreur approuvé
- [ ] Tableau de bord `/driver/dashboard` affiche statut, livraisons actives, gains
- [ ] Profil `/driver/profile` affiche véhicule réel et ville (non hardcodé)
- [ ] Passer hors ligne — statut mis à jour

## Livraisons
- [ ] Livreur AVAILABLE voit les livraisons disponibles `/driver/deliveries/available`
- [ ] Accepter une livraison — statut passe à ASSIGNED + driver ON_DELIVERY
- [ ] Marquer "récupérée au restaurant" → PICKED_UP
- [ ] Marquer "en route" → ON_THE_WAY
- [ ] Marquer "livrée" → DELIVERED + driver retourne AVAILABLE
- [ ] Livreur ne voit que SES livraisons

## Attribution admin
- [ ] Admin assigne manuellement un livreur à une commande READY
- [ ] Livreur voit la livraison assignée dans son dashboard
- [ ] Admin peut libérer le livreur (unassign)

## Sécurité
- [ ] Livreur PENDING ne peut pas accéder au dashboard (redirigé vers `/driver/pending`)
- [ ] Livreur REJECTED ne peut pas accéder au dashboard (redirigé vers `/driver/rejected`)
- [ ] Livreur SUSPENDED ne peut pas accéder au dashboard (redirigé vers `/driver/suspended`)
- [ ] Client ne peut pas accéder à `/driver/*`
- [ ] Restaurant ne peut pas modifier un livreur
- [ ] Admin garde le contrôle total

## Données
- [ ] Aucun livreur "Livreur DalleUp" de démo ne doit apparaître
- [ ] Aucune livraison fictive n'est affichée
- [ ] États vides propres : "Aucune livraison assignée pour le moment."
