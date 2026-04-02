import { SubscriptionsProvider } from "@/context/SubscriptionsContext";
import { useAuth } from "@clerk/expo";
import { tabs } from "@/constants/data";
import { colours, components } from "@/constants/theme";
import { cx } from "@/lib/tw";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabIconProps = {
    focused: boolean;
    icon: any;
    ionIcon?: string;
};

const tabBar = components.tabBar;

const TabsLayout = () => {
    const { isSignedIn, isLoaded } = useAuth();
    const insets = useSafeAreaInsets();

    if (!isLoaded) {
        return null;
    }

    if (!isSignedIn) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    const TabIcon = ({ focused, icon, ionIcon }: TabIconProps) => {
        return (
            <View style={cx("tabs-icon")}>
                <View style={cx("tabs-pill", focused && "tabs-active")}>
                    {ionIcon ? (
                        <Ionicons
                            name={ionIcon as any}
                            size={24}
                            color={focused ? colours.primary : "rgba(255,255,255,0.92)"}
                        />
                    ) : (
                        <Image
                            source={icon}
                            style={[
                                cx("tabs-glyph"),
                                { tintColor: focused ? colours.primary : "rgba(255,255,255,0.92)" },
                            ]}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </View>
        )
    }
    return (
    <SubscriptionsProvider>
    <Tabs screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
            position: "absolute",
            bottom: Math.max(insets.bottom, tabBar.horizontalInset),
            height: tabBar.height,
            marginHorizontal: tabBar.horizontalInset,
            borderRadius: tabBar.radius,
            backgroundColor: colours.primary,
            borderTopWidth: 0,
            elevation: 0,
        },
        tabBarItemStyle: {
            paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6
        },
        tabBarIconStyle: {
            width: tabBar.iconFrame,
            height: tabBar.iconFrame,
            alignItems: "center",
        }
    }}>
        {tabs.map((tab) => (
            <Tabs.Screen
                key={tab.name}
                name={tab.name}
                options={{
                    title: tab.title,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={tab.icon} ionIcon={tab.ionIcon} />
                    )
                }} />
        ))}
    </Tabs>
    </SubscriptionsProvider>
    );
}

export default TabsLayout;