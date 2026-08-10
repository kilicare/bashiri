"""
predictions/pdf_service.py

PDF generation service for saved markets with branding and watermarks.
"""
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os


def generate_saved_markets_pdf(saved_markets, tab_name="All Markets"):
    """
    Generate a PDF document with saved markets data.
    
    Args:
        saved_markets: List of saved market dictionaries with match and AI data
        tab_name: Name of the tab/category being generated
    
    Returns:
        BytesIO: PDF file content
    """
    buffer = BytesIO()
    
    # Custom page function to add watermark
    def add_page_footer(canvas, doc):
        # Add watermark logo
        try:
            # Try to find the logo in the frontend public directory
            logo_path = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'icon-192.png')
            if os.path.exists(logo_path):
                canvas.saveState()
                # Set transparency for watermark
                canvas.setFillAlpha(0.7)  # 70% opacity
                # Center the logo on the page
                page_width, page_height = A4
                logo = Image(logo_path, width=8*cm, height=8*cm)
                logo.drawOn(canvas, (page_width - 8*cm) / 2, (page_height - 8*cm) / 2)
                canvas.restoreState()
        except Exception:
            # If logo not found, skip watermark
            pass
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        onFirstPage=add_page_footer,
        onLaterPages=add_page_footer
    )
    
    # Custom styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#D4AF37'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#CFAF7B'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#333333'),
        spaceAfter=12
    )
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading3'],
        fontSize=14,
        textColor=colors.HexColor('#D4AF37'),
        spaceAfter=10,
        spaceBefore=20
    )
    
    market_style = ParagraphStyle(
        'CustomMarket',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#666666'),
        spaceAfter=8
    )
    
    ai_style = ParagraphStyle(
        'CustomAI',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#00FF87'),
        spaceAfter=8
    )
    
    # Build content
    content = []
    
    # Header with branding
    content.append(Paragraph("Bashiri - AI Football Predictions", title_style))
    content.append(Spacer(1, 0.3*cm))
    content.append(Paragraph(f"Saved Markets - {tab_name}", subtitle_style))
    content.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", normal_style))
    content.append(Spacer(1, 0.5*cm))
    
    # Group by match
    from collections import defaultdict
    grouped = defaultdict(list)
    for market in saved_markets:
        match_id = market['match']['id']
        grouped[match_id].append(market)
    
    # Generate content for each match
    for match_id, markets in grouped.items():
        match = markets[0]['match']
        
        # Match header
        content.append(Paragraph(
            f"{match['home_team']['name']} vs {match['away_team']['name']}",
            header_style
        ))
        content.append(Paragraph(
            f"{match['league']['name']} • {datetime.fromisoformat(match['kickoff_at']).strftime('%B %d, %Y %I:%M %p')}",
            normal_style
        ))
        
        # Markets table
        market_data = [['Market Type', 'AI Prediction', 'Confidence']]
        for market in markets:
            market_key = market['market_key']
            ai_pick = market.get('ai_pick', 'N/A')
            confidence = market.get('ai_confidence')
            conf_str = f"{confidence}%" if confidence else 'N/A'
            
            # Convert market key to readable label
            market_labels = {
                "1X2": "Matokeo ya Mechi",
                "DOUBLE_CHANCE": "Double Chance",
                "DRAW_NO_BET": "Draw No Bet",
                "OVER_UNDER_0_5": "Over/Under 0.5",
                "OVER_UNDER_1_5": "Over/Under 1.5",
                "OVER_UNDER_2_5": "Over/Under 2.5",
                "OVER_UNDER_3_5": "Over/Under 3.5",
                "OVER_UNDER_4_5": "Over/Under 4.5",
                "BTTS": "Timu Zote Kufunga (BTTS)",
            }
            market_label = market_labels.get(market_key, market_key)
            
            market_data.append([market_label, ai_pick, conf_str])
        
        # Create table
        table = Table(market_data, colWidths=[5*cm, 4*cm, 2*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#D4AF37')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F5F5F5')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#DDDDDD')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        content.append(table)
        content.append(Spacer(1, 0.5*cm))
    
    # Footer with watermark
    content.append(Spacer(1, 1*cm))
    content.append(Paragraph(
        "© 2026 Bashiri - AI Football Predictions. All rights reserved.",
        ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#999999'),
            alignment=TA_CENTER
        )
    ))
    content.append(Paragraph(
        "This document is generated by Bashiri AI. Predictions are for entertainment purposes only.",
        ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#999999'),
            alignment=TA_CENTER
        )
    ))
    
    # Build PDF
    doc.build(content)
    buffer.seek(0)
    return buffer
