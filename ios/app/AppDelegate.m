// AppDelegate.m —— 单窗口 WKWebView 壳，加载内置 www（离线可用）
#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

@interface PTAppDelegate : UIResponder <UIApplicationDelegate>
@property (nonatomic, strong) UIWindow *window;
@end

@interface PTWebVC : UIViewController <WKNavigationDelegate>
@property (nonatomic, strong) WKWebView *web;
@end

@implementation PTWebVC

- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = [UIColor blackColor];

    WKWebViewConfiguration *cfg = [WKWebViewConfiguration new];
    cfg.allowsInlineMediaPlayback = YES;
    cfg.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeNone;

    WKWebView *web = [[WKWebView alloc] initWithFrame:self.view.bounds configuration:cfg];
    web.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    web.navigationDelegate = self;
    web.scrollView.bounces = NO;
    web.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    web.opaque = NO;
    web.backgroundColor = [UIColor blackColor];
    if (@available(iOS 16.4, *)) { web.inspectable = NO; }
    [self.view addSubview:web];
    self.web = web;

    NSString *root = [[NSBundle mainBundle] pathForResource:@"www" ofType:nil];
    NSURL *index = [NSURL fileURLWithPath:[root stringByAppendingPathComponent:@"index.html"]];
    [web loadFileURL:index allowingReadAccessToURL:[NSURL fileURLWithPath:root]];
}

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
    NSLog(@"[PT] loaded: %@", webView.URL.lastPathComponent);
}

- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(WKNavigation *)navigation withError:(NSError *)error {
    NSLog(@"[PT] load failed: %@", error);
}

@end

@implementation PTAppDelegate

- (BOOL)application:(UIApplication *)app didFinishLaunchingWithOptions:(NSDictionary *)opts {
    self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    self.window.backgroundColor = [UIColor blackColor];
    self.window.rootViewController = [PTWebVC new];
    [self.window makeKeyAndVisible];
    return YES;
}

- (UIInterfaceOrientationMask)application:(UIApplication *)app
  supportedInterfaceOrientationsForWindow:(UIWindow *)w {
    return UIInterfaceOrientationMaskPortrait;
}

@end
