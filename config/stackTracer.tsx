import React from "react";
import { Text, View } from "react-native";

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        console.log("Stack trace:", error.stack);
        console.log('🔴 Error caught by boundary:');
        console.log('Error:', error.toString());
        console.log('Component Stack:', errorInfo.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: 'red', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                        Something went wrong.
                    </Text>
                    <Text style={{ textAlign: 'center' }}>
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </Text>
                </View>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
