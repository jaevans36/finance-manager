import { Palette, Type, Layers, Space, CheckCircle, Sparkles } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { Checkbox } from '../../components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

/** CSS variable colour tokens exposed by theme.css */
const colorCategories = [
  {
    title: 'Brand Colours',
    colors: [
      { name: 'Primary', css: '--primary' },
      { name: 'Primary Foreground', css: '--primary-foreground' },
    ],
  },
  {
    title: 'Background Colours',
    colors: [
      { name: 'Background', css: '--background' },
      { name: 'Card', css: '--card' },
      { name: 'Secondary', css: '--secondary' },
      { name: 'Muted', css: '--muted' },
      { name: 'Accent', css: '--accent' },
    ],
  },
  {
    title: 'Text Colours',
    colors: [
      { name: 'Foreground', css: '--foreground' },
      { name: 'Card Foreground', css: '--card-foreground' },
      { name: 'Muted Foreground', css: '--muted-foreground' },
      { name: 'Secondary Foreground', css: '--secondary-foreground' },
    ],
  },
  {
    title: 'Status Colours',
    colors: [
      { name: 'Destructive', css: '--destructive' },
      { name: 'Success', css: '--success' },
      { name: 'Warning', css: '--warning' },
    ],
  },
  {
    title: 'Border & Ring',
    colors: [
      { name: 'Border', css: '--border' },
      { name: 'Input', css: '--input' },
      { name: 'Ring', css: '--ring' },
    ],
  },
];

const spacingSizes = [
  { name: 'xs (1 / 4px)', tw: '1', px: '4px' },
  { name: 'sm (2 / 8px)', tw: '2', px: '8px' },
  { name: 'md (3 / 12px)', tw: '3', px: '12px' },
  { name: 'lg (4 / 16px)', tw: '4', px: '16px' },
  { name: 'xl (5 / 20px)', tw: '5', px: '20px' },
  { name: '2xl (6 / 24px)', tw: '6', px: '24px' },
  { name: '3xl (8 / 32px)', tw: '8', px: '32px' },
];

const DesignSystemPage = () => {
  return (
    <div className="mx-auto w-4/5 max-w-6xl px-5 pt-5 pb-8 md:w-[95%] md:px-[10px]">
      <h1 className="text-2xl font-semibold">Design System</h1>
      <p className="text-sm mt-1">
        Complete design system and component library for Finance Manager applications.
      </p>

      {/* Colour Palette */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-border">
          <Palette size={24} />
          <h2 className="text-lg font-semibold">Colour Palette</h2>
        </div>
        {colorCategories.map((category) => (
          <div key={category.title} className="mb-5">
            <h3 className="text-base font-semibold mb-2">{category.title}</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
              {category.colors.map((color) => (
                <div
                  key={color.name}
                  className="h-[100px] rounded-lg border border-border flex items-end p-3"
                  style={{ background: `hsl(var(${color.css}))` }}
                >
                  <span className="bg-background text-foreground px-2 py-1 rounded-sm text-xs font-medium">
                    {color.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Typography */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-border">
          <Type size={24} />
          <h2 className="text-lg font-semibold">Typography</h2>
        </div>

        <div className="mb-4 p-4 bg-card rounded-lg border border-border">
          <h1 className="text-2xl font-semibold">Heading 1 (Page Title)</h1>
          <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
            {`<h1 className="text-2xl font-semibold">Page Title</h1>`}
          </pre>
        </div>

        <div className="mb-4 p-4 bg-card rounded-lg border border-border">
          <h2 className="text-lg font-semibold">Heading 2 (Section Heading)</h2>
          <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
            {`<h2 className="text-lg font-semibold">Section Heading</h2>`}
          </pre>
        </div>

        <div className="mb-4 p-4 bg-card rounded-lg border border-border">
          <h3 className="text-base font-semibold">Heading 3 (Card Title)</h3>
          <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
            {`<h3 className="text-base font-semibold">Card Title</h3>`}
          </pre>
        </div>

        <div className="mb-4 p-4 bg-card rounded-lg border border-border">
          <p className="text-sm">Body Text (Standard body text, 14px)</p>
          <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
            {`<p className="text-sm">Standard body text</p>`}
          </pre>
        </div>

        <div className="mb-4 p-4 bg-card rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Secondary Text (Muted text, 14px)</p>
          <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
            {`<p className="text-sm text-muted-foreground">Secondary text</p>`}
          </pre>
        </div>

        <div className="mb-4 p-4 bg-card rounded-lg border border-border">
          <p className="text-xs">Small Text (Captions, meta text, 12px)</p>
          <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
            {`<p className="text-xs">Small text</p>`}
          </pre>
        </div>
      </section>

      {/* Spacing */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-border">
          <Space size={28} />
          <h2 className="text-lg font-semibold">Spacing Scale</h2>
        </div>
        <p className="text-sm">Tailwind 4px-based spacing scale:</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 mt-4">
          {spacingSizes.map((size) => (
            <div key={size.name}>
              <div
                className="bg-primary rounded-sm flex items-center justify-center text-primary-foreground text-xs font-semibold"
                style={{ width: size.px, height: size.px }}
              >
                {size.px}
              </div>
              <p className="text-xs mt-1 text-center font-semibold">{size.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Components */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-border">
          <Layers size={24} />
          <h2 className="text-lg font-semibold">Components</h2>
        </div>

        <div className="flex flex-col gap-5">
          {/* Buttons */}
          <div className="p-5 bg-muted rounded-lg border border-border">
            <h3 className="text-base font-semibold">Buttons</h3>
            <div className="flex flex-wrap gap-3 items-center mt-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center mt-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
            <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
              {`<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button size="sm">Small</Button>`}
            </pre>
          </div>

          {/* Badges */}
          <div className="p-5 bg-muted rounded-lg border border-border">
            <h3 className="text-base font-semibold">Badges</h3>
            <div className="flex flex-wrap gap-3 items-center mt-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
            </div>
            <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
              {`<Badge variant="success">Success</Badge>
<Badge variant="outline">Outline</Badge>`}
            </pre>
          </div>

          {/* Cards */}
          <div className="p-5 bg-muted rounded-lg border border-border">
            <h3 className="text-base font-semibold">Cards</h3>
            <Card className="mt-3">
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Card body content goes here. Cards provide a container for related content and
                  actions.
                </p>
              </CardContent>
            </Card>
            <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
              {`<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm">Card content</p>
  </CardContent>
</Card>`}
            </pre>
          </div>

          {/* Alerts */}
          <div className="p-5 bg-muted rounded-lg border border-border">
            <h3 className="text-base font-semibold">Alerts</h3>
            <div className="flex flex-col gap-3 mt-3">
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Your changes have been saved.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Something went wrong.</AlertDescription>
              </Alert>
              <Alert variant="warning">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>Please review your input.</AlertDescription>
              </Alert>
              <Alert>
                <AlertTitle>Info</AlertTitle>
                <AlertDescription>This is an informational message.</AlertDescription>
              </Alert>
            </div>
            <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
              {`<Alert variant="success">
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Your changes have been saved.</AlertDescription>
</Alert>`}
            </pre>
          </div>

          {/* Form Inputs */}
          <div className="p-5 bg-muted rounded-lg border border-border">
            <h3 className="text-base font-semibold">Form Inputs</h3>
            <div className="space-y-2 mt-3 max-w-sm">
              <Label htmlFor="example">Label</Label>
              <Input id="example" type="text" placeholder="Enter text..." />
            </div>
            <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
              {`<div className="space-y-2">
  <Label htmlFor="example">Label</Label>
  <Input id="example" placeholder="Enter text..." />
</div>`}
            </pre>
          </div>
        </div>
      </section>

      {/* Usage */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-border">
          <CheckCircle size={24} />
          <h2 className="text-lg font-semibold">Usage</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold mb-2">Importing Components</h3>
            <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
              {`// Import shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Use cn() for conditional classes
import { cn } from '@/lib/utils';
<div className={cn('p-4 rounded-lg', isActive && 'bg-primary text-white')}>

// Tailwind utility classes
<div className="p-4 text-2xl font-semibold text-foreground">

// TanStack Query hooks
import { useTasks, useCreateTask } from '@/hooks/queries';
const { data: tasks, isLoading } = useTasks({ completed: false });`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Interactive Showcase (Tabs) */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-border">
          <Sparkles size={24} />
          <h2 className="text-lg font-semibold">Interactive Showcase</h2>
        </div>
        <p className="text-sm mb-4">
          Explore all shadcn/ui component variants in the tabs below.
        </p>

        <Tabs defaultValue="buttons" className="w-full">
          <TabsList>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          {/* Buttons */}
          <TabsContent value="buttons" className="space-y-4">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Button Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              <h3 className="text-lg font-semibold">Button Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><CheckCircle className="h-4 w-4" /></Button>
              </div>
            </div>
          </TabsContent>

          {/* Cards */}
          <TabsContent value="cards" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description with muted text</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Card body content goes here.</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">Action</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Forms */}
          <TabsContent value="forms" className="space-y-4">
            <div className="rounded-lg border bg-card p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tw-input">Text Input</Label>
                <Input id="tw-input" placeholder="Enter text..." />
              </div>

              <Separator />

              <div className="flex items-center space-x-3">
                <Switch id="tw-switch" />
                <Label htmlFor="tw-switch">Dark Mode Toggle</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="tw-check" />
                <Label htmlFor="tw-check">Accept terms and conditions</Label>
              </div>
            </div>
          </TabsContent>

          {/* Feedback */}
          <TabsContent value="feedback" className="space-y-4">
            <div className="space-y-3">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Default Alert</AlertTitle>
                <AlertDescription>This is a default alert message.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Destructive</AlertTitle>
                <AlertDescription>Something went wrong.</AlertDescription>
              </Alert>
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Your changes have been saved.</AlertDescription>
              </Alert>
              <Alert variant="warning">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>Please review your input carefully.</AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        {/* Import guide */}
        <Card className="mt-5">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold mb-2">Using shadcn/ui Components</h3>
            <pre className="bg-muted text-foreground p-4 rounded-lg overflow-x-auto text-xs font-mono border border-border mt-3">
              {`// Import shadcn components (Tailwind-based)
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Use cn() for conditional classes
import { cn } from '@/lib/utils';
<div className={cn('p-4 rounded-lg', isActive && 'bg-primary text-white')}>

// TanStack Query hooks
import { useTasks, useCreateTask } from '@/hooks/queries';
const { data: tasks, isLoading } = useTasks({ completed: false });`}
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default DesignSystemPage;
