/**
 * Génère un mot de passe aléatoire.
 * @param length Longueur du mot de passe (par défaut 12)
 * @returns Un mot de passe aléatoire
 */
export function generateRandomPassword(length = 12): string {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const specialChars = '@#$%^&*!';

    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

    // Assurer qu'il y a au moins un caractère de chaque type
    let password = '';
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
    password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
    password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

    // Remplir le reste du mot de passe
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Mélanger le mot de passe
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }