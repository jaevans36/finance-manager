import styled from 'styled-components';
import { 
  Container, 
  Heading1, 
  Heading2, 
  Heading3, 
  Text, 
  TextSmall, 
  TextSecondary,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  SmallBadge,
  Input,
  Label,
  FormGroup,
  Alert
} from '@finance-manager/ui';
import { spacing, typography, borderRadius } from '@finance-manager/ui/styles';
import { useTheme } from '@finance-manager/ui';
import { Palette, Type, Layers, Space, CheckCircle } from 'lucide-react';

const PageContainer = styled(Container)`
  padding-top: ${spacing.xl};
  padding-bottom: ${spacing['3xl']};
`;

const Section = styled.section`
  margin-bottom: ${spacing['3xl']};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.md};
  margin-bottom: ${spacing.xl};
  padding-bottom: ${spacing.md};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${spacing.lg};
`;

const ColorSwatch = styled.div<{ $color: string }>`
  background: ${({ $color }) => $color};
  height: 100px;
  border-radius: ${borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: flex-end;
  padding: ${spacing.md};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ColorLabel = styled.div`
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${borderRadius.sm};
  ${typography.bodySmall}
  font-weight: 500;
`;

const TypographyExample = styled.div`
  margin-bottom: ${spacing.lg};
  padding: ${spacing.lg};
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const SpacingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: ${spacing.lg};
`;

const SpacingBox = styled.div<{ $size: string }>`
  background: ${({ theme }) => theme.colors.primary};
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  border-radius: ${borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  ${typography.bodySmall}
  font-weight: 600;
`;

const ComponentShowcase = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xl};
`;

const ComponentGroup = styled.div`
  padding: ${spacing.xl};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ComponentRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.md};
  align-items: center;
  margin-top: ${spacing.md};
`;

const CodeBlock = styled.pre`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  padding: ${spacing.lg};
  border-radius: ${borderRadius.lg};
  overflow-x: auto;
  ${typography.bodySmall}
  font-family: 'Courier New', monospace;
  border: 1px solid ${({ theme }) => theme.colors.border};
  margin-top: ${spacing.md};
`;

const DesignSystemPage = () => {
  const { theme } = useTheme();

  const colorCategories = [
    {
      title: 'Brand Colors',
      colors: [
        { name: 'Primary', value: theme.colors.primary },
        { name: 'Primary Hover', value: theme.colors.primaryHover },
        { name: 'Primary Disabled', value: theme.colors.primaryDisabled },
      ]
    },
    {
      title: 'Background Colors',
      colors: [
        { name: 'Background', value: theme.colors.background },
        { name: 'Background Secondary', value: theme.colors.backgroundSecondary },
        { name: 'Background Tertiary', value: theme.colors.backgroundTertiary },
        { name: 'Card Background', value: theme.colors.cardBackground },
      ]
    },
    {
      title: 'Text Colors',
      colors: [
        { name: 'Text', value: theme.colors.text },
        { name: 'Text Secondary', value: theme.colors.textSecondary },
        { name: 'Text Disabled', value: theme.colors.textDisabled },
      ]
    },
    {
      title: 'Status Colors',
      colors: [
        { name: 'Success', value: theme.colors.success },
        { name: 'Error', value: theme.colors.error },
        { name: 'Warning', value: theme.colors.warning },
        { name: 'Info', value: theme.colors.info },
      ]
    },
    {
      title: 'Border & Shadow',
      colors: [
        { name: 'Border', value: theme.colors.border },
        { name: 'Border Hover', value: theme.colors.borderHover },
      ]
    }
  ];

  const spacingSizes = [
    { name: 'xs', value: spacing.xs },
    { name: 'sm', value: spacing.sm },
    { name: 'md', value: spacing.md },
    { name: 'lg', value: spacing.lg },
    { name: 'xl', value: spacing.xl },
    { name: '2xl', value: spacing['2xl'] },
    { name: '3xl', value: spacing['3xl'] },
  ];

  return (
    <PageContainer>
      <Heading1>Design System</Heading1>
      <Text>Complete design system and component library for Finance Manager applications.</Text>

      {/* Colors Section */}
      <Section>
        <SectionHeader>
          <Palette size={24} />
          <Heading2>Colour Palette</Heading2>
        </SectionHeader>
        {colorCategories.map((category) => (
          <div key={category.title} style={{ marginBottom: spacing.xl }}>
            <Heading3>{category.title}</Heading3>
            <ColorGrid>
              {category.colors.map((color) => (
                <ColorSwatch key={color.name} $color={color.value}>
                  <ColorLabel>{color.name}</ColorLabel>
                </ColorSwatch>
              ))}
            </ColorGrid>
          </div>
        ))}
      </Section>

      {/* Typography Section */}
      <Section>
        <SectionHeader>
          <Type size={24} />
          <Heading2>Typography</Heading2>
        </SectionHeader>
        <TypographyExample>
          <Heading1>Heading 1 (Page Title)</Heading1>
          <CodeBlock>{`<Heading1>Page Title</Heading1>`}</CodeBlock>
        </TypographyExample>

        <TypographyExample>
          <Heading2>Heading 2 (Section Heading)</Heading2>
          <CodeBlock>{`<Heading2>Section Heading</Heading2>`}</CodeBlock>
        </TypographyExample>

        <TypographyExample>
          <Heading3>Heading 3 (Card Title)</Heading3>
          <CodeBlock>{`<Heading3>Card Title</Heading3>`}</CodeBlock>
        </TypographyExample>

        <TypographyExample>
          <Text>Body Text (Standard body text, 14px)</Text>
          <CodeBlock>{`<Text>Standard body text</Text>`}</CodeBlock>
        </TypographyExample>

        <TypographyExample>
          <TextSecondary>Secondary Text (Muted text, 14px)</TextSecondary>
          <CodeBlock>{`<TextSecondary>Secondary text</TextSecondary>`}</CodeBlock>
        </TypographyExample>

        <TypographyExample>
          <TextSmall>Small Text (Captions, meta text, 12px)</TextSmall>
          <CodeBlock>{`<TextSmall>Small text</TextSmall>`}</CodeBlock>
        </TypographyExample>
      </Section>

      {/* Spacing Section */}
      <Section>
        <SectionHeader>
          <Space size={28} />
          <Heading2>Spacing Scale</Heading2>
        </SectionHeader>
        <Text>4px-based spacing system:</Text>
        <SpacingGrid style={{ marginTop: spacing.lg }}>
          {spacingSizes.map((size) => (
            <div key={size.name}>
              <SpacingBox $size={size.value}>{size.value}</SpacingBox>
              <TextSmall style={{ marginTop: spacing.xs, textAlign: 'center', fontWeight: 600 }}>
                {size.name}
              </TextSmall>
            </div>
          ))}
        </SpacingGrid>
      </Section>

      {/* Components Section */}
      <Section>
        <SectionHeader>
          <Layers size={24} />
          <Heading2>Components</Heading2>
        </SectionHeader>

        <ComponentShowcase>
          {/* Buttons */}
          <ComponentGroup>
            <Heading3>Buttons</Heading3>
            <ComponentRow>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="outline">Outline</Button>
            </ComponentRow>
            <ComponentRow>
              <Button size="small">Small</Button>
              <Button size="medium">Medium</Button>
              <Button size="large">Large</Button>
            </ComponentRow>
            <CodeBlock>{`<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button size="small">Small</Button>`}</CodeBlock>
          </ComponentGroup>

          {/* Badges */}
          <ComponentGroup>
            <Heading3>Badges</Heading3>
            <ComponentRow>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="outline">Outline</Badge>
            </ComponentRow>
            <ComponentRow>
              <SmallBadge>Small Badge</SmallBadge>
            </ComponentRow>
            <CodeBlock>{`<Badge variant="success">Success</Badge>
<Badge variant="outline">Outline</Badge>
<SmallBadge>Small Badge</SmallBadge>`}</CodeBlock>
          </ComponentGroup>

          {/* Cards */}
          <ComponentGroup>
            <Heading3>Cards</Heading3>
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
              </CardHeader>
              <CardBody>
                <Text>Card body content goes here. Cards provide a container for related content and actions.</Text>
              </CardBody>
            </Card>
            <CodeBlock>{`<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardBody>
    <Text>Card content</Text>
  </CardBody>
</Card>`}</CodeBlock>
          </ComponentGroup>

          {/* Alerts */}
          <ComponentGroup>
            <Heading3>Alerts</Heading3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <Alert variant="success">
                <CheckCircle size={16} />
                <span>Success! Your changes have been saved.</span>
              </Alert>
              <Alert variant="error">
                <span>Error! Something went wrong.</span>
              </Alert>
              <Alert variant="warning">
                <span>Warning! Please review your input.</span>
              </Alert>
              <Alert variant="info">
                <span>Info: This is an informational message.</span>
              </Alert>
            </div>
            <CodeBlock>{`<Alert variant="success">Success message</Alert>
<Alert variant="error">Error message</Alert>`}</CodeBlock>
          </ComponentGroup>

          {/* Form Inputs */}
          <ComponentGroup>
            <Heading3>Form Inputs</Heading3>
            <FormGroup>
              <Label htmlFor="example">Label</Label>
              <Input id="example" type="text" placeholder="Enter text..." />
            </FormGroup>
            <CodeBlock>{`<FormGroup>
  <Label htmlFor="example">Label</Label>
  <Input id="example" placeholder="Enter text..." />
</FormGroup>`}</CodeBlock>
          </ComponentGroup>
        </ComponentShowcase>
      </Section>

      {/* Usage Section */}
      <Section>
        <SectionHeader>
          <CheckCircle size={24} />
          <Heading2>Usage</Heading2>
        </SectionHeader>
        <Card>
          <CardBody>
            <Heading3>Importing from @finance-manager/ui</Heading3>
            <CodeBlock>{`// Import components
import { Button, Card, Input } from '@finance-manager/ui';

// Import design tokens
import { spacing, typography } from '@finance-manager/ui/styles';

// Import contexts
import { ThemeProvider, useTheme } from '@finance-manager/ui';

// Use in styled-components
const Container = styled.div\`
  padding: \${spacing.lg};
  \${typography.pageTitle}
  color: \${({ theme }) => theme.colors.text};
\`;`}</CodeBlock>
          </CardBody>
        </Card>
      </Section>
    </PageContainer>
  );
};

export default DesignSystemPage;
