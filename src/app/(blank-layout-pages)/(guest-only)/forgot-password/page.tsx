// Next Imports
import type { Metadata } from 'next';

// Component Imports
import ForgotPassword from './_components/ForgotPassword';

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your password'
};

const ForgotPasswordPage = async () => {
  // Vars
  const mode = await getServerMode();

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <ForgotPassword mode={mode} />
    </div>
  );
};

export default ForgotPasswordPage;
