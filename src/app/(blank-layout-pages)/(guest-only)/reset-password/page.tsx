// Next Imports
import type { Metadata } from 'next';

// Component Imports
import ResetPassword from './_components/ResetPassword';

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your password'
};

const ResetPasswordPage = async () => {
  // Vars
  const mode = await getServerMode();

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <ResetPassword mode={mode} />
    </div>
  );
};

export default ResetPasswordPage;
