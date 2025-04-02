import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock } from "lucide-react";

const Blog = () => {
  const blogPosts = [
    {
      id: "ai-healthcare-documentation",
      title: "The Future of AI in Healthcare Documentation",
      excerpt: "Exploring how artificial intelligence is transforming clinical documentation and improving patient care.",
      content: `
        <h2>The Future of AI in Healthcare Documentation</h2>
        <p>Artificial intelligence is revolutionizing the way healthcare professionals document patient encounters. By leveraging natural language processing and machine learning algorithms, AI systems can now transcribe, organize, and even analyze clinical documentation in ways that were previously impossible.</p>
        <p>The benefits of this technological advancement are numerous:</p>
        <ul>
          <li>Reduction in documentation time by up to 70%</li>
          <li>Decrease in physician burnout related to administrative tasks</li>
          <li>Improved accuracy and completeness of medical records</li>
          <li>Better patient care through more comprehensive documentation</li>
        </ul>
        <p>As these systems continue to evolve, we can expect even more sophisticated capabilities, such as real-time clinical decision support based on documentation patterns and integration with other healthcare technologies.</p>
        <p>The transition to AI-assisted documentation isn't without challenges, however. Issues related to privacy, security, and the potential for algorithmic bias must be carefully addressed as these technologies become more widely adopted.</p>
        <p>Despite these challenges, the trajectory is clear: AI will play an increasingly central role in healthcare documentation, ultimately allowing clinicians to focus more on patient care and less on paperwork.</p>
      `,
      date: "May 15, 2023",
      readTime: "8 min read",
      author: {
        name: "Dr. Emmanuel Egberuare",
        role: "CEO & Founder",
        image: "/lovable-uploads/7b3ffde1-30a8-40c7-af74-8f1bed121068.png"
      },
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1170&auto=format&fit=crop"
    },
    {
      id: "PrecisionNote-case-study",
      title: "How PrecisionNote Reduced Documentation Time by 70%",
      excerpt: "Case study of how a large medical practice implemented AI documentation and the results they achieved.",
      content: `
        <h2>How PrecisionNote Reduced Documentation Time by 70%</h2>
        <p>When Northwest Medical Associates, a multi-specialty practice with over 50 physicians, approached PrecisionNote, they were facing a crisis. Their physicians were spending an average of 2-3 hours daily on documentation, leading to burnout, decreased patient satisfaction, and reduced revenue.</p>
        <p>After implementing PrecisionNote's AI-powered documentation solution, the results were dramatic:</p>
        <ul>
          <li>Documentation time decreased from an average of 150 minutes to 45 minutes daily per physician</li>
          <li>Physician satisfaction scores increased by 35%</li>
          <li>Patient throughput improved by 22%</li>
          <li>Documentation quality and compliance metrics improved by 28%</li>
        </ul>
        <p>The implementation process took just four weeks, with minimal disruption to clinical operations. Physicians reported that the AI system was intuitive to use and required minimal training.</p>
        <p>"The impact on our practice has been transformative," said Dr. Jennifer Liu, Medical Director at Northwest Medical Associates. "Our physicians can now focus on patients rather than paperwork, and the quality of our documentation has actually improved."</p>
        <p>The success at Northwest Medical has become a blueprint for other practices looking to leverage AI for documentation efficiency while maintaining high-quality care.</p>
      `,
      date: "April 28, 2023",
      readTime: "6 min read",
      author: {
        name: "Michael Chen",
        image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop"
      },
      image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=1932&auto=format&fit=crop"
    },
    {
      id: "hipaa-compliance-ai",
      title: "HIPAA Compliance in the Age of AI",
      excerpt: "Understanding the regulatory landscape for AI in healthcare and ensuring patient data privacy.",
      content: `
        <h2>HIPAA Compliance in the Age of AI</h2>
        <p>As artificial intelligence becomes increasingly integrated into healthcare documentation and decision-making processes, ensuring HIPAA compliance presents new challenges and considerations for healthcare organizations.</p>
        <p>The Health Insurance Portability and Accountability Act (HIPAA) was enacted long before current AI technologies existed, but its principles of patient privacy and data security remain highly relevant. Healthcare organizations implementing AI solutions must navigate several key areas:</p>
        <h3>Data Access and Storage</h3>
        <p>AI systems require access to sensitive patient information to function effectively. Organizations must implement robust access controls, encryption, and audit trails to protect this data. Cloud storage solutions used by AI platforms must meet HIPAA requirements for business associate agreements.</p>
        <h3>De-identification Standards</h3>
        <p>When using patient data to train AI algorithms, proper de-identification is essential. This goes beyond simply removing names and addresses and must address the potential for re-identification through pattern analysis.</p>
        <h3>Transparency and Explainability</h3>
        <p>Healthcare providers must be able to explain how AI systems reach their conclusions, especially when these systems influence clinical decision-making. "Black box" algorithms present compliance challenges under HIPAA's right of access and correction provisions.</p>
        <p>The Office for Civil Rights (OCR) has begun addressing AI-specific concerns in recent guidance, but many questions remain. Healthcare organizations should adopt a proactive approach, conducting regular risk assessments and ensuring their AI vendors understand healthcare's unique regulatory requirements.</p>
        <p>By addressing these challenges systematically, healthcare organizations can harness the power of AI while maintaining the trust of their patients and compliance with regulatory requirements.</p>
      `,
      date: "April 10, 2023",
      readTime: "10 min read",
      author: {
        name: "Emma Rodriguez",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop"
      },
      image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  const BlogPost = () => {
    const pathname = window.location.pathname;
    const postId = pathname.split('/blog/')[1];
    const post = blogPosts.find(post => post.id === postId);
    
    if (!post) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Article not found</h2>
            <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been moved.</p>
            <Link to="/blog">
              <Button>Back to Blog</Button>
            </Link>
          </div>
        </div>
      );
    }
    
    return (
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <Link to="/blog" className="text-primary hover:underline mb-8 inline-flex items-center">
          ← Back to all articles
        </Link>
        
        <div className="mb-8">
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-64 lg:h-96 object-cover rounded-xl shadow-sm"
          />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-semibold mb-6">{post.title}</h1>
        
        <div className="flex items-center mb-8">
          <Avatar className="h-10 w-10 mr-4">
            <AvatarImage src={post.author.image} alt={post.author.name} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{post.author.name}</p>
            {post.author.role && <p className="text-sm text-muted-foreground">{post.author.role}</p>}
          </div>
          <div className="ml-auto flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{post.date}</span>
            <span className="mx-2">•</span>
            <Clock className="mr-2 h-4 w-4" />
            <span>{post.readTime}</span>
          </div>
        </div>
        
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    );
  };

  const pathname = window.location.pathname;
  if (pathname.startsWith('/blog/') && pathname !== '/blog/') {
    return (
      <div className="min-h-screen bg-background">
        <nav className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
          <div className="container mx-auto max-w-7xl flex justify-between items-center">
            <Link to="/" className="flex items-center">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="ml-3 text-xl font-medium">PrecisionNote</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link to="/dashboard">
                <Button variant="outline" className="hidden sm:inline-flex transition-all hover:shadow-sm">
                  Log in
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button className="shadow-sm hover:shadow-md transition-all">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </nav>
        
        <BlogPost />
        
        <footer className="bg-white border-t border-border py-12">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <Link to="/" className="flex items-center">
                  <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">D</span>
                  </div>
                  <span className="ml-2 text-lg font-medium">PrecisionNote</span>
                </Link>
                <p className="text-muted-foreground mt-2 text-sm">
                  Transforming clinical documentation
                </p>
              </div>
              
              <div className="flex space-x-8">
                <div>
                  <h4 className="font-medium mb-3">Product</h4>
                  <ul className="space-y-2">
                    <li><Link to="/features" className="text-muted-foreground hover:text-foreground text-sm">Features</Link></li>
                    <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground text-sm">Pricing</Link></li>
                    <li><Link to="/integrations" className="text-muted-foreground hover:text-foreground text-sm">Integrations</Link></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Company</h4>
                  <ul className="space-y-2">
                    <li><Link to="/careers" className="text-muted-foreground hover:text-foreground text-sm">Careers</Link></li>
                    <li><Link to="/blog" className="text-muted-foreground hover:text-foreground text-sm">Blog</Link></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Legal</h4>
                  <ul className="space-y-2">
                    <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground text-sm">Privacy</Link></li>
                    <li><Link to="/terms" className="text-muted-foreground hover:text-foreground text-sm">Terms</Link></li>
                    <li><Link to="/security" className="text-muted-foreground hover:text-foreground text-sm">Security</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center">
              <p>© 2025 PrecisionNote, Inc. All rights reserved.</p>
              <div className="mt-4 md:mt-0 flex space-x-4">
                <a href="https://twitter.com" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">Twitter</a>
                <a href="https://linkedin.com" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="https://github.com" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">GitHub</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="ml-3 text-xl font-medium">PrecisionNote</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link to="/dashboard">
              <Button variant="outline" className="hidden sm:inline-flex transition-all hover:shadow-sm">
                Log in
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button className="shadow-sm hover:shadow-md transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      
      <section className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
        <FadeIn>
          <div className="text-center mb-16">
            <h1 className="text-4xl font-semibold mb-6">Blog</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Insights, updates, and thought leadership on AI in healthcare and medical documentation.
            </p>
          </div>
        </FadeIn>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, i) => (
            <FadeIn key={i} delay={0.1 + i * 0.1}>
              <Card className="h-full shadow hover:shadow-md transition-shadow duration-300 overflow-hidden">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{post.date}</span>
                    <span className="mx-2">•</span>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{post.readTime}</span>
                  </div>
                  <CardTitle className="hover:text-primary transition-colors">
                    <Link to={`/blog/${post.id}`}>{post.title}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{post.excerpt}</p>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.image} alt={post.author.name} />
                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{post.author.name}</p>
                      {post.author.role && <p className="text-xs text-muted-foreground">{post.author.role}</p>}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </FadeIn>
          ))}
        </div>
        
        <FadeIn delay={0.5}>
          <div className="mt-12 text-center">
            <Button variant="outline" className="shadow-sm hover:shadow-md transition-all">
              Load More Articles
            </Button>
          </div>
        </FadeIn>
      </section>
      
      <footer className="bg-white border-t border-border py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Link to="/" className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="ml-2 text-lg font-medium">PrecisionNote</span>
              </Link>
              <p className="text-muted-foreground mt-2 text-sm">
                Transforming clinical documentation
              </p>
            </div>
            
            <div className="flex space-x-8">
              <div>
                <h4 className="font-medium mb-3">Product</h4>
                <ul className="space-y-2">
                  <li><Link to="/features" className="text-muted-foreground hover:text-foreground text-sm">Features</Link></li>
                  <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground text-sm">Pricing</Link></li>
                  <li><Link to="/integrations" className="text-muted-foreground hover:text-foreground text-sm">Integrations</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Company</h4>
                <ul className="space-y-2">
                  <li><Link to="/careers" className="text-muted-foreground hover:text-foreground text-sm">Careers</Link></li>
                  <li><Link to="/blog" className="text-muted-foreground hover:text-foreground text-sm">Blog</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Legal</h4>
                <ul className="space-y-2">
                  <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground text-sm">Privacy</Link></li>
                  <li><Link to="/terms" className="text-muted-foreground hover:text-foreground text-sm">Terms</Link></li>
                  <li><Link to="/security" className="text-muted-foreground hover:text-foreground text-sm">Security</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center">
            <p>© 2025 PrecisionNote, Inc. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <a href="https://twitter.com" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://linkedin.com" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://github.com" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
