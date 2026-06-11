export const sendOtpSms = async (phoneNumber: string, otp: string) => {
  try {
    const message = `Votre code de validation est : ${otp}`;
    const apiKey = process.env.TUNISIESMS_API_KEY!;
    const senderId = process.env.TUNISIESMS_SENDER_ID!;
    const phone = phoneNumber.replace('+', '');

    const params = new URLSearchParams({
      fct: 'sms',
      key: apiKey,
      mobile: "216" + phone, 
      sms: message,
      sender: senderId,
    });

    const url = `https://api.l2t.io/tn/v0/api/api.aspx?${params.toString()}`;

    const resp = await fetch(url, { method: 'GET' });

    if (!resp.ok) {
      throw new Error(`Erreur lors de l'envoi du SMS : ${resp.statusText}`);
    }

    const data = await resp.text(); 
    console.log('Réponse SMS API:', data);
    return data;
  } catch (error) {
    console.error('Erreur sendOtpSms:', error);
    throw error;
  }
};
