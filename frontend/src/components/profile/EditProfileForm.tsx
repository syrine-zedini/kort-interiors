import { useState } from 'react';
import { UserProfile, updateUserProfile, UpdateProfileData } from '@/services/user.service';

interface EditProfileFormProps {
  profile: UserProfile;
  onSuccess?: (updatedProfile: UserProfile) => void;
  onCancel?: () => void;
}

export default function EditProfileForm({
  profile,
  onSuccess,
  onCancel,
}: EditProfileFormProps) {
  const [formData, setFormData] = useState({
    username: profile.username,
    email: profile.email || '',
    phoneNumber: profile.phoneNumber || '',
    address: profile.address || '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    if (name === 'email') setEmailError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setSuccess(null);

    try {
      // Validation
      if (!formData.username) {
        setError('Username is required');
        return;
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setEmailError("Veuillez entrer une adresse e-mail valide");
        return;
      }

      if (formData.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber)) {
        setError('Invalid phone number format');
        return;
      }

      if (showPasswordFields) {
        if (!passwordData.oldPassword) {
          setError('Old password is required');
          return;
        }
        if (!passwordData.newPassword) {
          setError('New password is required');
          return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (passwordData.newPassword.length < 6) {
          setError('New password must be at least 6 characters');
          return;
        }
      }

      setIsLoading(true);

      const updateData: UpdateProfileData = {
        username: formData.username,
        email: formData.email || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address || undefined,
      };

      if (showPasswordFields) {
        updateData.oldPassword = passwordData.oldPassword;
        updateData.newPassword = passwordData.newPassword;
      }

      const updatedProfile = await updateUserProfile(updateData);
      setSuccess('Profile updated successfully!');
      onSuccess?.(updatedProfile);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update profile';
      if (/already in use|already exists|email/i.test(errorMessage)) {
        setEmailError("Cet e-mail est deja utilise. Vous ne pouvez pas l'utiliser.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-profile-form">
      <div className="form-group">
        <label htmlFor="username" className="form-label">
        Nom d'utilisateur
        </label>
        <input
          id="username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleFieldChange}
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleFieldChange}
          className="form-input"
          disabled={isLoading}
        />
        {emailError && <div className="email-error-message">{emailError}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="phoneNumber" className="form-label">
        Numéro de téléphone
        </label>
        <input
          id="phoneNumber"
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleFieldChange}
          className="form-input"
          placeholder="+1234567890"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="address" className="form-label">
          Adresse
        </label>
        <input
          id="address"
          type="text"
          name="address"
          value={formData.address}
          onChange={handleFieldChange}
          className="form-input"
          placeholder="Votre adresse complète"
          disabled={isLoading}
        />
      </div>

      {/* Password Section */}
      <div className="password-section">
        <button
          type="button"
          onClick={() => {
            setShowPasswordFields(!showPasswordFields);
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setError(null);
          }}
          className="toggle-password-btn"
        >
          <span className="toggle-icon">{showPasswordFields ? '−' : '+'}</span>
          Changer le mot de passe
        </button>

        {showPasswordFields && (
          <div className="password-fields">
            <div className="form-group">
              <label htmlFor="oldPassword" className="form-label">
                Mot de passe actuel
              </label>
              <input
                id="oldPassword"
                type="password"
                name="oldPassword"
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                Nouveau mot de passe
              </label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmer le nouveau mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="form-input"
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Success Message */}
      {success && <div className="success-message">{success}</div>}

      {/* Buttons */}
      <div className="form-actions">
        <button
          type="submit"
          className="submit-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="cancel-btn"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
      </div>

      <style jsx>{`
        .edit-profile-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: #7a7a7a;
        }

        .form-input {
          padding: 12px 14px;
          border: 1px solid #e8e8e8;
          border-radius: 0;
          font-size: 14px;
          color: #1a1a1a;
          background: #fafafa;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #bdbdbd;
          box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.08);
        }

        .form-input:disabled {
          background-color: #f3f3f3;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .password-section {
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid #e8e8e8;
        }

        .toggle-password-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 0;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #1a1a1a;
          transition: color 0.2s;
        }

        .toggle-password-btn:hover {
          color: #444;
        }

        .toggle-password-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .toggle-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border: 1px solid #1a1a1a;
          border-radius: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .password-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
          padding: 16px;
          background-color: #fafafa;
          border: 1px solid #e8e8e8;
        }

        .error-message {
          padding: 12px 16px;
          background-color: #fff;
          border: 1px solid #f0d2d2;
          color: #8b1f1f;
          font-size: 13px;
        }

        .email-error-message {
          margin-top: 6px;
          color: #8b1f1f;
          font-size: 11px;
        }

        .success-message {
          padding: 12px 16px;
          background-color: #fff;
          border: 1px solid #cfe2cf;
          color: #2f6f36;
          font-size: 13px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .submit-btn,
        .cancel-btn {
          padding: 13px 24px;
          border-radius: 0;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
        }

        .submit-btn {
          flex: 1;
          border: none;
          background-color: #1a1a1a;
          color: white;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #333;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cancel-btn {
          flex: 1;
          background-color: #fff;
          border: 1px solid #d8d8d8;
          color: #1a1a1a;
        }

        .cancel-btn:hover:not(:disabled) {
          background-color: #f7f7f7;
        }

        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}
