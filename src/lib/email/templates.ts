export function welcomeClient(name: string) {
  const subject = "Bienvenue sur DalleUp";
  const html = `<p>Bonjour ${escapeHtml(name)},</p>
<p>Bienvenue sur <strong>DalleUp</strong>. Votre compte client est prêt. Commandez vos repas préférés en quelques clics.</p>
<p>À très vite,<br/>L&apos;équipe DalleUp</p>`;
  const text = `Bonjour ${name},\n\nBienvenue sur DalleUp. Votre compte client est prêt. Commandez vos repas préférés en quelques clics.\n\nÀ très vite,\nL'équipe DalleUp`;
  return { subject, html, text };
}

export function welcomeRestaurant(name: string) {
  const subject = "Bienvenue partenaire DalleUp";
  const html = `<p>Bonjour ${escapeHtml(name)},</p>
<p>Votre restaurant est inscrit sur <strong>DalleUp</strong>. Complétez votre menu et commencez à recevoir des commandes.</p>
<p>À très vite,<br/>L&apos;équipe DalleUp</p>`;
  const text = `Bonjour ${name},\n\nVotre restaurant est inscrit sur DalleUp. Complétez votre menu et commencez à recevoir des commandes.\n\nÀ très vite,\nL'équipe DalleUp`;
  return { subject, html, text };
}

export function welcomeDriver(name: string) {
  const subject = "Bienvenue livreur DalleUp";
  const html = `<p>Bonjour ${escapeHtml(name)},</p>
<p>Votre compte livreur <strong>DalleUp</strong> est créé. Connectez-vous pour voir les livraisons disponibles.</p>
<p>À très vite,<br/>L&apos;équipe DalleUp</p>`;
  const text = `Bonjour ${name},\n\nVotre compte livreur DalleUp est créé. Connectez-vous pour voir les livraisons disponibles.\n\nÀ très vite,\nL'équipe DalleUp`;
  return { subject, html, text };
}

export function orderConfirmationClient(orderNumber: string, total: string, restaurantName: string) {
  const subject = `Commande ${orderNumber} confirmée`;
  const html = `<p>Votre commande <strong>${escapeHtml(orderNumber)}</strong> chez <strong>${escapeHtml(restaurantName)}</strong> est confirmée.</p>
<p>Total : <strong>${escapeHtml(total)}</strong></p>
<p>Vous recevrez un email à chaque changement de statut.</p>`;
  const text = `Votre commande ${orderNumber} chez ${restaurantName} est confirmée.\nTotal : ${total}\nVous recevrez un email à chaque changement de statut.`;
  return { subject, html, text };
}

export function newOrderRestaurant(orderNumber: string, total: string, customerName: string) {
  const subject = `Nouvelle commande ${orderNumber}`;
  const html = `<p>Nouvelle commande <strong>${escapeHtml(orderNumber)}</strong> de <strong>${escapeHtml(customerName)}</strong>.</p>
<p>Total : <strong>${escapeHtml(total)}</strong></p>
<p>Connectez-vous à votre tableau de bord pour la traiter.</p>`;
  const text = `Nouvelle commande ${orderNumber} de ${customerName}.\nTotal : ${total}\nConnectez-vous à votre tableau de bord pour la traiter.`;
  return { subject, html, text };
}

export function orderStatusChanged(orderNumber: string, status: string) {
  const subject = `Statut commande ${orderNumber} mis à jour`;
  const html = `<p>Votre commande <strong>${escapeHtml(orderNumber)}</strong> passe en statut <strong>${escapeHtml(status)}</strong>.</p>`;
  const text = `Votre commande ${orderNumber} passe en statut ${status}.`;
  return { subject, html, text };
}

export function paymentReceived(orderNumber: string, amount: string, method: string) {
  const subject = `Paiement reçu pour ${orderNumber}`;
  const html = `<p>Le paiement de <strong>${escapeHtml(amount)}</strong> pour la commande <strong>${escapeHtml(orderNumber)}</strong> a été reçu via <strong>${escapeHtml(method)}</strong>.</p>`;
  const text = `Le paiement de ${amount} pour la commande ${orderNumber} a été reçu via ${method}.`;
  return { subject, html, text };
}

export function passwordReset(name: string, resetUrl: string) {
  const subject = "Réinitialisation de votre mot de passe DalleUp";
  const html = `<p>Bonjour ${escapeHtml(name)},</p>
<p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe. Ce lien est valable 30 minutes.</p>
<p><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p>
<p>Si vous n&apos;avez pas demandé cette réinitialisation, ignorez cet email.</p>`;
  const text = `Bonjour ${name},\n\nCliquez sur le lien ci-dessous pour réinitialiser votre mot de passe. Ce lien est valable 30 minutes.\n${resetUrl}\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.`;
  return { subject, html, text };
}

export function passwordResetSuccess(name: string) {
  const subject = "Votre mot de passe DalleUp a été réinitialisé";
  const html = `<p>Bonjour ${escapeHtml(name)},</p>
<p>Votre mot de passe a été réinitialisé avec succès.</p>
<p>Si ce n&apos;est pas vous, contactez immédiatement notre support.</p>`;
  const text = `Bonjour ${name},\n\nVotre mot de passe a été réinitialisé avec succès.\nSi ce n'est pas vous, contactez immédiatement notre support.`;
  return { subject, html, text };
}

export function accountValidated(name: string, role: string) {
  const subject = `Votre compte ${role} est validé`;
  const html = `<p>Bonjour ${escapeHtml(name)},</p>
<p>Votre compte <strong>${escapeHtml(role)}</strong> a été validé. Vous pouvez maintenant utiliser toutes les fonctionnalités.</p>`;
  const text = `Bonjour ${name},\n\nVotre compte ${role} a été validé. Vous pouvez maintenant utiliser toutes les fonctionnalités.`;
  return { subject, html, text };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
