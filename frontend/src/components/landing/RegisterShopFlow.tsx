import React from 'react';
import { OnboardingRegistration } from '../../types';
import { MultiStepOnboardingWizard } from '../onboarding/MultiStepOnboardingWizard';

export interface RegisterShopFlowProps {
  onRegisterShop: (data: Omit<OnboardingRegistration, 'id' | 'createdAt'>) => OnboardingRegistration;
  onNavigateToPOS: () => void;
  onNavigateToStock: () => void;
  onClose: () => void;
  onSwitchToLogin?: () => void;
  isModal?: boolean;
}

export const RegisterShopFlow: React.FC<RegisterShopFlowProps> = ({
  onRegisterShop,
  onNavigateToPOS,
  onNavigateToStock,
  onClose,
  onSwitchToLogin,
  isModal = true
}) => {
  return (
    <MultiStepOnboardingWizard
      onRegisterShop={onRegisterShop}
      onNavigateToPOS={onNavigateToPOS}
      onNavigateToStock={onNavigateToStock}
      onClose={onClose}
      onSwitchToLogin={onSwitchToLogin}
      isModal={isModal}
    />
  );
};

export default RegisterShopFlow;
