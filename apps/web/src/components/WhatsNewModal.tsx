import { X, Sparkles, CheckCircle2, Calendar } from 'lucide-react';
import styled from 'styled-components';
import { borderRadius, shadows, focusRing } from '../styles/layout';
import versionData from '../../../../VERSION.json';

interface ChangelogEntry {
  type: string;
  category: string;
  description: string;
  impact: string;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${borderRadius.xl}px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: ${shadows.xl};
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.success} 100%);
  padding: 32px;
  color: white;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: ${borderRadius.lg}px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  ${focusRing}
`;

const HeaderIcon = styled.div`
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: ${borderRadius['2xl']}px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

const HeaderTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
`;

const HeaderSubtitle = styled.p`
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Content = styled.div`
  padding: 32px;
  max-height: calc(80vh - 200px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    border-radius: ${borderRadius.sm}px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: ${borderRadius.sm}px;

    &:hover {
      background: ${({ theme }) => theme.colors.textSecondary};
    }
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${borderRadius.lg}px;
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    margin-bottom: 0;
  }
`;

const FeatureIcon = styled.div`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: ${borderRadius.md}px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.success}20;
  color: ${({ theme }) => theme.colors.success};
  margin-top: 2px;
`;

const FeatureContent = styled.div`
  flex: 1;
`;

const FeatureCategory = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FeatureDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  margin: 4px 0 0 0;
  line-height: 1.5;
`;

const DescriptionText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 24px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Footer = styled.div`
  padding: 20px 32px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FooterLink = styled.a`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    text-decoration: underline;
  }
`;

const DismissButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${borderRadius.lg}px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.success};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.success}4D;
  }
`;

interface WhatsNewModalProps {
  onClose: () => void;
}

export const WhatsNewModal = ({ onClose }: WhatsNewModalProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Modal role="dialog" aria-labelledby="whats-new-title" aria-describedby="whats-new-description">
        <Header>
          <CloseButton onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </CloseButton>
          <HeaderIcon>
            <Sparkles size={32} />
          </HeaderIcon>
          <HeaderTitle id="whats-new-title">What&apos;s New in v{versionData.version}</HeaderTitle>
          <HeaderSubtitle id="whats-new-description">
            <Calendar size={14} />
            Released {formatDate(versionData.releaseDate)}
            {versionData.codename && ` • "${versionData.codename}"`}
          </HeaderSubtitle>
        </Header>

        <Content>
          {versionData.description && (
            <DescriptionText>
              {versionData.description}
            </DescriptionText>
          )}

          {versionData.changelog && versionData.changelog.length > 0 && (
            <>
              <SectionTitle>
                <CheckCircle2 size={20} />
                New Features & Improvements
              </SectionTitle>
              <FeatureList>
                {versionData.changelog.map((change: ChangelogEntry, index: number) => (
                  <FeatureItem key={index}>
                    <FeatureIcon>
                      <CheckCircle2 size={14} />
                    </FeatureIcon>
                    <FeatureContent>
                      <FeatureCategory>{change.category}</FeatureCategory>
                      <FeatureDescription>{change.description}</FeatureDescription>
                    </FeatureContent>
                  </FeatureItem>
                ))}
              </FeatureList>
            </>
          )}
        </Content>

        <Footer>
          <FooterLink href="/version-history" onClick={(e) => { e.preventDefault(); onClose(); window.location.href = '/version-history'; }}>
            View full version history →
          </FooterLink>
          <DismissButton onClick={onClose}>
            Got it!
          </DismissButton>
        </Footer>
      </Modal>
    </Overlay>
  );
};
