# CUSTOM FONT SETUP INSTRUCTIONS

## OPTIONAL: Add Modern Fonts to Bashiri PDFs

The current implementation uses premium Helvetica styling with professional improvements. For even better results, you can add custom modern fonts like Outfit or Roboto.

## How to Add Custom Fonts

### Step 1: Download Font Files

Download the following TTF font files and place them in this directory:

**Outfit Font (Recommended):**
- `Outfit-Regular.ttf` - https://fonts.google.com/specimen/Outfit
- `Outfit-Bold.ttf` - https://fonts.google.com/specimen/Outfit
- `Outfit-Medium.ttf` - https://fonts.google.com/specimen/Outfit

**Roboto Font (Alternative):**
- `Roboto-Regular.ttf` - https://fonts.google.com/specimen/Roboto
- `Roboto-Bold.ttf` - https://fonts.google.com/specimen/Roboto

### Step 2: Register Fonts in PDF Service

Add this code to `backend/predictions/pdf_service.py` at the top after imports:

```python
def register_custom_fonts():
    """Register custom fonts for PDF generation"""
    try:
        # Register Outfit fonts
        pdfmetrics.registerFont(TTFont('Outfit-Regular', 
            os.path.join(os.path.dirname(__file__), 'fonts', 'Outfit-Regular.ttf')))
        pdfmetrics.registerFont(TTFont('Outfit-Bold', 
            os.path.join(os.path.dirname(__file__), 'fonts', 'Outfit-Bold.ttf')))
        pdfmetrics.registerFont(TTFont('Outfit-Medium', 
            os.path.join(os.path.dirname(__file__), 'fonts', 'Outfit-Medium.ttf')))
        
        # Register font family
        pdfmetrics.registerFontFamily('Outfit',
            normal='Outfit-Regular',
            bold='Outfit-Bold')
        
        print("Custom fonts registered successfully")
    except Exception as e:
        print(f"Error registering custom fonts: {e}")
        print("Falling back to standard fonts")

# Call this at module level
register_custom_fonts()
```

### Step 3: Update Font References

Replace all font references in the PDF styles:

```python
# Replace 'Helvetica-Bold' with 'Outfit-Bold'
# Replace 'Helvetica' with 'Outfit-Regular'

# Example changes:
title_style = ParagraphStyle(
    'CustomTitle',
    fontName='Outfit-Bold',  # Changed from Helvetica-Bold
    fontSize=28,
    # ... rest of style
)

normal_style = ParagraphStyle(
    'CustomNormal', 
    fontName='Outfit-Regular',  # Changed from Helvetica
    fontSize=12,
    # ... rest of style
)
```

## Current Implementation

The current PDF generation uses:
- **Helvetica-Bold** for headings and emphasis
- **Helvetica** for body text
- Premium spacing and sizing
- Professional color scheme
- Modern table styling

This already provides a significant improvement over the original implementation with:
- Better font sizes (28px title, 18px subtitle, 12px body)
- Improved line spacing (1.4x-1.5x)
- Professional table styling
- Color-coded confidence indicators
- Premium footer with divider
- Subtle watermark (8% opacity)
- Page numbers
- Section dividers

## Font Licensing

Both Outfit and Roboto are open-source fonts with permissive licenses:
- **Outfit**: SIL Open Font License (OFL)
- **Roboto**: Apache License 2.0

These can be used commercially without issues.

## Benefits of Custom Fonts

- **Modern Appearance**: Outfit has a geometric, premium look
- **Brand Consistency**: Match your web app typography
- **Better Readability**: Optimized for digital and print
- **Professional Feel**: Stand out from competitors

## Testing

After adding custom fonts:
1. Test PDF generation with sample data
2. Check font rendering in PDF viewers
3. Verify file size remains reasonable
4. Test on different platforms (Windows, Mac, Linux)

## Troubleshooting

**Font not found error:**
- Ensure TTF files are in the correct directory
- Check file names match exactly (case-sensitive)
- Verify file permissions

**PDF generation fails:**
- Check font file integrity
- Try with standard fonts first to isolate the issue
- Ensure ReportLab version supports TTF fonts

**Font looks different than expected:**
- Verify correct font weight selected
- Check font size and leading values
- Test with different text content

## Current Status

✅ Premium PDF transformation complete
✅ Professional styling implemented
✅ All Phase 1-4 features working
✅ Sample PDFs generated successfully

The PDF system now produces premium-quality documents ready for production use.