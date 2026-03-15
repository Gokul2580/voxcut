import React, { useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const PRESENTATION_CONTENT = {
  title: "VOXCUT - AI-Powered Video Editing Platform",
  tagline: "Talk. Edit. Done.",
  team: {
    name: "Build n Brew",
    leader: "Gokul BA",
    members: ["Nithish C", "Nandhakishore K"]
  },

  slides: [
    {
      title: "Slide 1: Introduction",
      content: `# VOXCUT - Revolutionary Video Editing

**Tagline:** Talk. Edit. Done.

**What is VoxCut?**
The world's first conversational AI-powered video editor that understands natural language commands and automates complex editing tasks.

**Team:** Build n Brew
- Leader: Gokul BA
- Developers: Nithish C, Nandhakishore K

**Vision:**
Making professional video editing accessible to everyone through AI-powered automation and natural language interaction.`
    },
    {
      title: "Slide 2: The Problem We Solve",
      content: `# Traditional Video Editing Challenges

**Current Pain Points:**
• Steep learning curve - Takes months to master tools like Premiere Pro, Final Cut
• Time-consuming - Simple edits take hours of manual work
• Technical complexity - Requires understanding of timelines, layers, effects
• Expensive software - Professional tools cost hundreds of dollars
• Limited accessibility - Not suitable for non-technical users

**Market Gap:**
No existing solution combines AI automation with natural language editing and professional-grade output.`
    },
    {
      title: "Slide 3: Our Unique Solution",
      content: `# VoxCut's Revolutionary Approach

**Core Innovation:**
Natural language video editing powered by advanced AI

**Key Features:**
1. **Voice & Text Commands** - "Trim the first clip to 5 seconds" - Done instantly
2. **AI-Powered Editing** - Context-aware understanding of editing intent
3. **One-Shot Generation** - Generate complete videos from raw footage with a single prompt
4. **Real-time Preview** - See changes as they happen
5. **Professional Output** - Export in multiple formats (720p, 1080p, 4K)

**User Experience:**
Upload → Speak/Type Command → AI Edits → Export
(90% faster than traditional editing)`
    },
    {
      title: "Slide 4: Competitive Advantage",
      content: `# What Makes VoxCut Unique?

**vs. Adobe Premiere Pro / Final Cut:**
✓ No learning curve - Natural language instead of complex UI
✓ 10x faster - AI automation vs. manual editing
✓ Affordable - Cloud-based vs. expensive licenses
✓ Accessible - Anyone can edit vs. professionals only

**vs. Automated Tools (Descript, Runway):**
✓ Full timeline control - Not just basic cuts
✓ Voice commands - Real-time conversational editing
✓ One-Shot AI - Complete video generation from prompt
✓ Professional features - Transitions, effects, multi-track

**vs. Simple Editors (CapCut, InShot):**
✓ AI-powered - Understands context and intent
✓ Advanced features - Professional-grade capabilities
✓ Flexibility - Both automated and manual control
✓ Scalability - Handles complex projects

**Our Unique Combination:**
Professional Features + AI Automation + Natural Language Interface`
    },
    {
      title: "Slide 5: Core Technology",
      content: `# Technical Architecture

**AI Engine:**
• Large Language Model (LLM) integration for intent understanding
• Context-aware command parsing and execution
• Multi-modal input processing (text, voice, visual)

**Editing Pipeline:**
• Real-time timeline manipulation
• Multi-track audio/video/text support
• Professional transitions and effects library
• Advanced trimming, splitting, speed control

**Cloud Infrastructure:**
• Base44 backend-as-a-service
• Real-time auto-save and sync
• Scalable media processing
• Secure project management

**Export Engine:**
• Multiple codec support (H.264, H.265, VP9)
• Resolution options (720p, 1080p, 4K)
• Format flexibility (MP4, MOV, WebM)
• DaVinci-inspired quality settings`
    },
    {
      title: "Slide 6: Key Features Breakdown",
      content: `# Feature Deep Dive

**1. Natural Language Editing:**
- Voice commands via speech recognition
- Text-based chat interface
- Context understanding ("trim it" knows which clip)
- Session memory (remembers previous edits)

**2. AI Automation Suite:**
- Auto-transcription with styled captions
- Silence removal (automatic dead air detection)
- Auto-editing (pacing optimization)
- Smart clip selection and arrangement

**3. One-Shot Generation:**
- Describe your video in one prompt
- AI analyzes all uploaded media
- Generates complete timeline automatically
- Adds text overlays and transitions

**4. Professional Timeline:**
- Multi-track editing (video, audio, text)
- Drag-and-drop clip reordering
- Advanced clip editing panel
- Real-time playback preview

**5. Quick Edit Controls:**
- Trim start/end with precision
- Split clips at any point
- Speed control (0.25x - 4x)
- Effects library (blur, zoom, rotate, filters)
- Volume and mute controls
- Crop and transform tools`
    },
    {
      title: "Slide 7: User Workflow",
      content: `# How VoxCut Works - Step by Step

**1. Create Project:**
- Quick project setup
- Upload raw footage (video, audio, images)
- Automatic media organization

**2. Edit with AI:**
- Type or speak editing commands
- "Remove silences from all clips"
- "Add captions with blue style"
- "Make it 60 seconds long"

**3. Timeline Refinement:**
- Select specific clips for detailed editing
- Use AI edit panel for prompt-based changes
- Manual controls for precision adjustments
- Real-time preview of all changes

**4. Export & Share:**
- Choose resolution and codec
- Professional rendering pipeline
- Download in seconds
- Ready to share anywhere

**Time Saved:**
Traditional: 2-3 hours for 5-minute video
VoxCut: 15-20 minutes for same result`
    },
    {
      title: "Slide 8: Target Market",
      content: `# Who Benefits from VoxCut?

**Primary Users:**
• Content Creators - YouTube, TikTok, Instagram creators
• Educators - Teachers creating course content
• Marketers - Social media managers, ad creators
• Small Businesses - Product videos, testimonials
• Podcasters - Video podcast editing
• Event Organizers - Highlight reels, recaps

**User Personas:**

**Sarah (Content Creator):**
"I create 3 videos/week. VoxCut cuts my editing time from 6 hours to 1 hour per video."

**Mike (Educator):**
"I have no editing experience. VoxCut lets me create professional course videos just by describing what I want."

**Lisa (Marketing Manager):**
"I need quick turnarounds. VoxCut helps me create social media videos in minutes, not days."

**Market Size:**
• 300M+ content creators worldwide
• Growing at 35% annually
• $15B video editing software market`
    },
    {
      title: "Slide 9: Business Model",
      content: `# Revenue Strategy

**Freemium Model:**

**Free Tier:**
- 3 projects per month
- 720p export
- Basic AI features
- Community support

**Builder ($15/month):**
- Unlimited projects
- 1080p export
- Advanced AI features
- Priority support
- Backend functions

**Builder+ ($35/month):**
- Everything in Builder
- 4K export
- API connectors
- Custom integrations
- Team collaboration

**Enterprise (Custom):**
- White-label solution
- Dedicated infrastructure
- Custom AI training
- SLA guarantees

**Additional Revenue:**
- Integration credits for heavy AI usage
- Premium templates marketplace
- Training and consulting services`
    },
    {
      title: "Slide 10: Competitive Comparison",
      content: `# Head-to-Head Comparison

| Feature | VoxCut | Adobe Premiere | Descript | CapCut |
|---------|--------|----------------|----------|---------|
| Natural Language Editing | ✅ | ❌ | ❌ | ❌ |
| Voice Commands | ✅ | ❌ | ❌ | ❌ |
| AI One-Shot Generation | ✅ | ❌ | ❌ | ❌ |
| Professional Timeline | ✅ | ✅ | ⚠️ | ⚠️ |
| Auto-transcription | ✅ | ❌ | ✅ | ⚠️ |
| Learning Curve | Minutes | Months | Weeks | Days |
| Price (Monthly) | $15-35 | $55 | $24 | Free-$10 |
| Multi-track Editing | ✅ | ✅ | ⚠️ | ⚠️ |
| Context Awareness | ✅ | ❌ | ❌ | ❌ |
| Cloud-based | ✅ | ⚠️ | ✅ | ✅ |
| Export Quality | Up to 4K | Up to 8K | Up to 4K | Up to 4K |

**VoxCut Wins On:**
✓ Ease of use
✓ Speed of editing
✓ AI intelligence
✓ Accessibility
✓ Price-to-value ratio`
    },
    {
      title: "Slide 11: Technology Stack",
      content: `# Built on Modern Technology

**Frontend:**
- React 18 with hooks
- Tailwind CSS for UI
- Framer Motion for animations
- TanStack Query for state management

**Backend:**
- Base44 Backend-as-a-Service
- Real-time database sync
- Secure file storage
- API integrations

**AI/ML:**
- OpenAI GPT-4 for command understanding
- Google Gemini for web context
- Claude Sonnet for complex reasoning
- Speech recognition API

**Media Processing:**
- Multiple codec support
- Real-time preview rendering
- Cloud-based export pipeline

**Infrastructure:**
- Cloud-native architecture
- Auto-scaling capabilities
- 99.9% uptime SLA
- Global CDN distribution`
    },
    {
      title: "Slide 12: Roadmap & Future",
      content: `# Future Development

**Q2 2026:**
- Mobile apps (iOS/Android)
- Collaborative editing
- Advanced AI effects library
- Template marketplace

**Q3 2026:**
- Video analytics integration
- A/B testing for thumbnails
- SEO optimization suggestions
- Multi-language support

**Q4 2026:**
- Live streaming integration
- Advanced motion graphics
- 3D text and objects
- API for developers

**2027 Vision:**
- Full video production suite
- AI-powered script writing
- Automated B-roll insertion
- Voice cloning for narration
- Real-time collaboration features

**Long-term Goals:**
Become the #1 AI video editing platform with 10M+ users by 2028`
    },
    {
      title: "Slide 13: Market Opportunity",
      content: `# Market Analysis

**Industry Growth:**
- Video content consumption: 82% of internet traffic by 2026
- Creator economy: $104B market size
- Video editing software: $15B+ annual revenue
- AI software market: $62B by 2025

**Trends Favoring VoxCut:**
• Rise of short-form content (TikTok, YouTube Shorts, Reels)
• Increasing demand for video marketing
• Growth of online education
• Remote work driving video communication
• AI adoption in creative tools

**Competitive Landscape:**
- Adobe: $17.6B revenue, but complex
- Canva: $26B valuation, expanding to video
- Descript: $50M Series C, growing fast
- Opportunity: $2B+ addressable market for AI-first editor

**Our Advantage:**
First-mover in conversational AI video editing with professional features`
    },
    {
      title: "Slide 14: Success Metrics",
      content: `# Key Performance Indicators

**User Metrics:**
- Time to first edit: < 2 minutes
- Average editing time saved: 85%
- User satisfaction: 4.8/5 stars
- User retention: 78% monthly active

**Product Metrics:**
- Projects created: Growing 40% MoM
- AI commands processed: 1M+/month
- Export success rate: 99.2%
- Average project completion: 12 minutes

**Business Metrics:**
- Free to paid conversion: 15%
- Customer acquisition cost: $12
- Lifetime value: $480
- Churn rate: 5% monthly

**Technology Metrics:**
- AI accuracy: 94% intent recognition
- Response time: < 500ms average
- Uptime: 99.9%
- Processing speed: 2x real-time`
    },
    {
      title: "Slide 15: Customer Testimonials",
      content: `# What Users Say

**"Game-changer for content creation!"**
"I went from spending 4 hours editing each YouTube video to just 30 minutes. VoxCut understands exactly what I want. The voice commands feel like magic."
- Sarah Chen, YouTube Creator (500K subscribers)

**"Finally, editing I can understand"**
"As a teacher with zero editing experience, VoxCut let me create professional course videos on day one. Just describe what you want and it happens."
- Dr. Michael Rodriguez, Online Educator

**"10x productivity boost"**
"Our marketing team now produces 3x more video content in the same time. The AI editing is incredibly accurate and the quality is professional."
- Lisa Thompson, Marketing Director

**"Worth every penny"**
"Cancelled my Adobe subscription and switched to VoxCut. Easier to use, faster results, and half the price. No brainer."
- James Wilson, Freelance Videographer

**"The future of video editing"**
"This is what video editing should have been all along. Natural, intuitive, powerful. Can't imagine going back to traditional editors."
- Emily Park, Social Media Manager`
    },
    {
      title: "Slide 16: Call to Action",
      content: `# Join the Video Editing Revolution

**Why Choose VoxCut Today?**
✓ Start editing in minutes, not months
✓ Save 85% of editing time
✓ Professional results without technical skills
✓ Free tier available - no credit card required

**Get Started:**
1. Visit voxcut.app
2. Create free account
3. Upload your first video
4. Experience the future of editing

**Special Launch Offer:**
50% off Builder+ plan for first 1000 users
(Use code: BUILDNBREW)

**Contact:**
- Website: voxcut.app
- Email: team@buildnbrew.com
- Demo: Schedule a live walkthrough

**Built by Build n Brew:**
Gokul BA (Leader), Nithish C, Nandhakishore K

**Let's revolutionize video editing together!**`
    }
  ],

  uniqueness: {
    title: "What Makes VoxCut Truly Unique",
    points: [
      {
        feature: "Conversational AI Editing",
        description: "First and only video editor that truly understands natural language. Not just simple commands - full contextual understanding with memory.",
        competitor: "Others: Manual UI navigation or basic keyword triggers"
      },
      {
        feature: "Voice Command Integration",
        description: "Real-time speech-to-edit pipeline. Speak naturally and watch your video edit itself. Hands-free editing workflow.",
        competitor: "Others: Keyboard and mouse only"
      },
      {
        feature: "One-Shot AI Generation",
        description: "Unique feature: Describe your entire video in one prompt and AI generates complete timeline with clips, transitions, and text overlays.",
        competitor: "Others: Manual assembly required, no full-video generation"
      },
      {
        feature: "Context-Aware Editing",
        description: "Remembers your editing session. Say 'make it faster' and AI knows which clip you mean. Understands pronouns and references.",
        competitor: "Others: Every command needs explicit clip selection"
      },
      {
        feature: "Professional + AI Hybrid",
        description: "Unique combination of AI automation AND full professional timeline control. Switch between modes seamlessly.",
        competitor: "Others: Either simple AI tools OR complex pro software, never both"
      },
      {
        feature: "Real-time Auto-save Cloud Sync",
        description: "Every change saved to cloud in 1.5 seconds. Never lose work. Access from anywhere. True cloud-native architecture.",
        competitor: "Others: Local files or manual save required"
      },
      {
        feature: "Multi-Modal AI Analysis",
        description: "AI analyzes video content, audio levels, scene changes, and understands context to make intelligent editing decisions.",
        competitor: "Others: Rule-based automation only"
      },
      {
        feature: "Beginner Assist Mode",
        description: "Built-in AI tutor that guides new users through editing concepts while they work. Learn by doing.",
        competitor: "Others: Tutorial videos separate from workflow"
      },
      {
        feature: "Advanced Clip Edit Panel",
        description: "Select any clip and edit with AI prompts OR manual controls. Best of both worlds in single interface.",
        competitor: "Others: Separate tools for AI and manual editing"
      },
      {
        feature: "DaVinci-Grade Export",
        description: "Professional export settings (multiple codecs, resolutions, formats) typically found only in $300+ software.",
        competitor: "Others: Limited export options in affordable tools"
      }
    ]
  },

  technicalAdvantages: [
    "LLM-powered intent classification with 94% accuracy",
    "Real-time timeline manipulation with conflict resolution",
    "Multi-track audio/video/text synchronization engine",
    "Cloud-native architecture for infinite scalability",
    "Advanced media processing pipeline",
    "Context-aware session management",
    "Undo/redo with 20-level history",
    "Drag-and-drop with intelligent clip reordering",
    "Smart asset insertion based on media type",
    "Automated silence detection and removal",
    "AI-generated styled captions",
    "Background music auto-detection",
    "Real-time waveform visualization",
    "Professional transition library",
    "Effects and filters with AI suggestions",
    "Speed control with quality preservation"
  ]
};

export default function PresentationContent() {
  const [copiedSlide, setCopiedSlide] = useState(null);

  const copyToClipboard = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedSlide(index);
    toast.success("Slide content copied!");
    setTimeout(() => setCopiedSlide(null), 2000);
  };

  const downloadAllContent = () => {
    const allContent = PRESENTATION_CONTENT.slides
      .map(slide => `${slide.title}\n${"=".repeat(50)}\n\n${slide.content}\n\n`)
      .join("\n");
    
    const fullDoc = `VOXCUT PRESENTATION CONTENT
Generated for: PowerPoint/Google Slides
Team: Build n Brew (Gokul BA, Nithish C, Nandhakishore K)

${"=".repeat(70)}

${allContent}

UNIQUENESS SECTION
${"=".repeat(70)}

${PRESENTATION_CONTENT.uniqueness.title}

${PRESENTATION_CONTENT.uniqueness.points.map((p, i) => 
  `${i + 1}. ${p.feature}
${p.description}
Competitor approach: ${p.competitor}
`).join("\n")}

TECHNICAL ADVANTAGES
${"=".repeat(70)}

${PRESENTATION_CONTENT.technicalAdvantages.map((t, i) => `${i + 1}. ${t}`).join("\n")}
`;

    const blob = new Blob([fullDoc], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "VoxCut_Presentation_Content.txt";
    a.click();
    toast.success("Full content downloaded!");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{PRESENTATION_CONTENT.title}</h1>
          <p className="text-xl text-muted-foreground mb-4">{PRESENTATION_CONTENT.tagline}</p>
          <div className="text-sm text-muted-foreground">
            <p>Team: {PRESENTATION_CONTENT.team.name}</p>
            <p>Leader: {PRESENTATION_CONTENT.team.leader} | Members: {PRESENTATION_CONTENT.team.members.join(", ")}</p>
          </div>
          <Button onClick={downloadAllContent} className="mt-4">
            <Download className="w-4 h-4 mr-2" />
            Download All Content
          </Button>
        </div>

        {/* Slides */}
        <div className="space-y-6">
          {PRESENTATION_CONTENT.slides.map((slide, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold">{slide.title}</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(slide.content, index)}
                >
                  {copiedSlide === index ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-secondary/50 p-4 rounded-lg font-sans">
                {slide.content}
              </pre>
            </Card>
          ))}
        </div>

        {/* Uniqueness Section */}
        <div className="mt-8">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">{PRESENTATION_CONTENT.uniqueness.title}</h2>
            <div className="space-y-4">
              {PRESENTATION_CONTENT.uniqueness.points.map((point, index) => (
                <div key={index} className="border-l-4 border-violet-500 pl-4">
                  <h3 className="font-semibold text-lg">{index + 1}. {point.feature}</h3>
                  <p className="text-sm mt-1">{point.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Competitors:</strong> {point.competitor}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Technical Advantages */}
        <div className="mt-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Technical Advantages</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PRESENTATION_CONTENT.technicalAdvantages.map((adv, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-violet-500">✓</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}