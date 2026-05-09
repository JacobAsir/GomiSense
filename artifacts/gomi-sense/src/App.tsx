import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Scan from "@/pages/scan";
import Result from "@/pages/result";
import HowItWorks from "@/pages/how-it-works";
import Municipalities from "@/pages/municipalities";
import Directory from "@/pages/directory";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/scan" component={Scan} />
        <Route path="/result" component={Result} />
        <Route path="/directory" component={Directory} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/municipalities" component={Municipalities} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
