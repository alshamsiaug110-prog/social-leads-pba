import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ConversationLog from "./pages/ConversationLog";
import FaqLibrary from "./pages/FaqLibrary";
import Home from "./pages/Home";
import InboxImport from "./pages/InboxImport";
import Integrations from "./pages/Integrations";
import Publisher from "./pages/Publisher";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/faqs" component={FaqLibrary} /><Route path="/imports" component={InboxImport} /><Route path="/conversations" component={ConversationLog} /><Route path="/publish" component={Publisher} /><Route path="/integrations" component={Integrations} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
