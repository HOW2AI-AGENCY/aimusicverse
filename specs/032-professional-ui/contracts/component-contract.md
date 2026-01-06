# Component Contract

**Feature**: 032-professional-ui

## Button Component

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  gradient?: boolean;
  className?: string;
  children: ReactNode;
}
```

## Card Component

```typescript
interface CardProps {
  elevation?: 0 | 1 | 2 | 3;
  padding?: "sm" | "md" | "lg";
  gradient?: boolean;
  className?: string;
  children: ReactNode;
}
```

## TouchTarget Wrapper

```typescript
interface TouchTargetProps {
  minSize?: 44 | 48;
  children: ReactNode;
}
```

## Usage

Components maintain existing props, add optional styling enhancements.