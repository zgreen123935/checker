# Technical Notes for HVAC Compatibility Checker

## UI Components and Animations

### Scanning Animation
- **Container Hierarchy**: The scanning line animation must be placed within the same container as the image it's scanning
  - ❌ Don't: Place in separate container (causes misalignment)
  - ✅ Do: Place as sibling to image element within preview container
  ```jsx
  <div className="preview-large">
    <img ... />
    <div className="scanning-line" />
  </div>
  ```

- **CSS Animation Considerations**:
  - Use `position: absolute` with parent `position: relative` for proper overlay
  - Set `pointer-events: none` to prevent interference with underlying elements
  - Animation distance should be greater than container width (e.g., 600%) for smooth looping
  - Gradient width should be narrow (e.g., 20%) for a focused scanning effect

### Layout Management
- **Fixed Height Layout**:
  - Root container needs explicit height (`height: 100vh`)
  - Child containers should use flex layout with `flex: 1`
  - Use `min-height: 0` on flex children to enable proper scrolling
  - Set `overflow-y: auto` on scrollable containers

### Image Display
- **Image Scaling**:
  - Use `object-fit: contain` to maintain aspect ratio
  - Container should have both `min-height` and `max-height`
  - Parent containers need proper height constraints

## State Management

### View States
- **Upload**: Initial state for file selection
- **Analyzing**: Shows scanning animation
- **Results**: Displays analysis outcome

### Important State Variables
- `view`: Controls which component view to render
- `files`: Stores uploaded file objects
- `previews`: Stores image preview URLs
- `isAnalyzing`: Controls scanning animation visibility

## Performance Considerations

### Image Loading
- Create object URLs for previews
- Clean up URLs on component unmount
- Handle HEIC image conversion if needed

### Animation Performance
- Use `transform` for animations (better performance than position properties)
- Keep gradient calculations simple
- Use `will-change` for heavy animations if needed

## Future Improvements
- Consider adding loading states for image processing
- Implement proper error boundaries
- Add accessibility attributes for animations
- Consider adding animation pause during background tab
