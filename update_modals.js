const fs = require('fs');
const path = require('path');

const modalsPath = 'src/components/auth';

const files = [
  'ChangeEmailModal.jsx',
  'ChangePhoneModal.jsx',
  'ChangeUsernameModal.jsx',
  'ChangePasswordModal.jsx',
  'DeleteAccountModal.jsx',
  'ForgotPasswordModal.jsx',
  'TokenModal.jsx',
  'TwoFactorModal.jsx'
];

const mutationsToToast = {
  'ChangeEmailModal.jsx': [['confirmMutation', 'E-posta adresiniz başarıyla güncellendi.']],
  'ChangePhoneModal.jsx': [['confirmMutation', 'Telefon numaranız başarıyla güncellendi.']],
  'ChangeUsernameModal.jsx': [['changeUsernameMutation', 'Kullanıcı adınız başarıyla değiştirildi.']],
  'ChangePasswordModal.jsx': [['changePasswordMutation', 'Şifreniz başarıyla değiştirildi.']],
  'DeleteAccountModal.jsx': [['deleteAccountMutation', 'Hesabınız başarıyla silindi.']],
  'ForgotPasswordModal.jsx': [['confirmResetMutation', 'Şifreniz başarıyla sıfırlandı.']],
  'TokenModal.jsx': [['confirmEmailMutation', 'E-posta adresiniz başarıyla doğrulandı.']],
  'TwoFactorModal.jsx': [
    ['enableTwoFactorMutation', 'İki aşamalı doğrulama başarıyla aktifleştirildi.'],
    ['disableTwoFactorMutation', 'İki aşamalı doğrulama başarıyla kapatıldı.']
  ]
};

for (const file of files) {
  const filePath = path.join(modalsPath, file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Add toast import if missing
  if (!content.includes("import toast from 'react-hot-toast'")) {
    content = content.replace(/(import .*? from .*?\n)/, "$1import toast from 'react-hot-toast'\n");
  }

  // Inject toasts
  const targets = mutationsToToast[file];
  if (targets) {
    for (const [mutName, msg] of targets) {
      const mutRegex = new RegExp(`const ${mutName}\\s*=\\s*useMutation\\(\\{[\\s\\S]*?onSuccess:\\s*\\(.*?\\)\\s*=>\\s*\\{`);
      const match = content.match(mutRegex);
      
      if (match) {
        const insertPos = match.index + match[0].length;
        const nextLines = content.slice(insertPos, insertPos + 100);
        
        if (!nextLines.includes('toast.success(')) {
          content = content.slice(0, insertPos) + 
            `\n      toast.success('${msg}', { duration: 3000 })` + 
            content.slice(insertPos);
        }
      }
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log("Modals updated.");
