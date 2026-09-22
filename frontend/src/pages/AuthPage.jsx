import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { authApi } from '../services/api';
import { isFirebaseConfigured } from '../services/firebaseAuth';

function getErrorMessage(error) {
  const firebaseErrors = {
    'auth/email-already-in-use': 'An account with this email already exists. Please sign in.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Use a stronger password with at least 8 characters.',
    'auth/user-disabled': 'This Firebase account has been disabled.'
  };
  if (error?.code && firebaseErrors[error.code]) return firebaseErrors[error.code];
  return error?.response?.data?.error || error?.response?.data?.message || 'Unable to connect to API Shield.';
}

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const firebaseEnabled = isFirebaseConfigured;
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await authApi.register(form);
      } else {
        await authApi.login({ email: form.email, password: form.password });
      }
      navigate('/dashboard', { replace: true, state: { from: location.pathname } });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-story">
          <Link to="/" className="auth-brand"><span className="auth-brand-mark"><ShieldCheck size={20} /></span><span><strong>API Shield</strong><small>Adaptive API defense</small></span></Link>
          <div className="auth-story-copy">
            <span className="auth-eyebrow"><Sparkles size={14} /> Security operations console</span>
            <h1>Know what your API is seeing.</h1>
            <p>Review live traffic, understand client behavior, and keep suspicious requests away from your real application.</p>
          </div>
          <div className="auth-story-points">
            <div><CheckCircle2 size={17} /><span><strong>Behavior-aware</strong><small>Each request is evaluated in context.</small></span></div>
            <div><CheckCircle2 size={17} /><span><strong>Model-assisted</strong><small>ML signals work with transparent rules.</small></span></div>
            <div><CheckCircle2 size={17} /><span><strong>Production-ready</strong><small>Forward protected traffic to your API.</small></span></div>
          </div>
          <div className="auth-story-footer"><span className="auth-story-pulse" /> Gateway services ready <span>•</span> secure access</div>
        </section>

        <section className="auth-form-card">
          <div className="auth-mobile-brand"><Link to="/" className="auth-brand"><span className="auth-brand-mark"><ShieldCheck size={20} /></span><span><strong>API Shield</strong><small>Adaptive API defense</small></span></Link></div>
          <div className="auth-form-heading">
            <div className="auth-form-icon"><LockKeyhole size={19} /></div>
            <span className="auth-form-label">Dashboard access</span>
            <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
            <p>{isRegister
              ? firebaseEnabled
                ? 'Create a Firebase Authentication account to access the protected dashboard.'
                : 'Create the first protected dashboard account. Registration is enabled during initial setup.'
              : firebaseEnabled
                ? 'Sign in with your Firebase Authentication account to open the security dashboard.'
                : 'Use your API Shield credentials to open the security operations dashboard.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <label className="auth-field"><span>Full name</span><input name="name" value={form.name} onChange={updateField} autoComplete="name" required minLength={2} maxLength={80} placeholder="Your name" /></label>
            )}
            <label className="auth-field"><span>Email address</span><input type="email" name="email" value={form.email} onChange={updateField} autoComplete="email" required placeholder="you@example.com" /></label>
            <label className="auth-field"><span>Password</span><input type="password" name="password" value={form.password} onChange={updateField} autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={8} maxLength={128} placeholder="At least 8 characters" /></label>

            {error && <div role="alert" className="auth-error">{error}</div>}

            <button type="submit" disabled={submitting} className="auth-submit">{submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} {!submitting && <ArrowRight size={16} />}</button>
          </form>

          <p className="auth-switch">{isRegister ? 'Already have an account?' : 'Need to create the first account?'}{' '}<Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Register'}</Link></p>
          <p className="auth-security-note"><LockKeyhole size={13} /> Your dashboard session is protected.</p>
        </section>
      </div>
    </main>
  );
}
