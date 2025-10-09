# UI/UX Polish

## Goals
- Elevate clarity, contrast, and responsiveness
- Consistent paddings, radius, and shadows
- Accessible focus states and readable typography

## Changes
- Buttons: added subtle elevation, tighter active state
- Cards: hover elevation for affordance
- Tables: clearer headers and row hovers
- Dialogs: backdrop blur and stronger elevation
- Layout: background tied to theme `bg-background`

## Flow
```mermaid
flowchart LR
Theme[@theme tokens] --> Components[UI Components]
Components --> Pages[Pages]
Pages --> Feedback[QA]
Feedback --> Components
```



