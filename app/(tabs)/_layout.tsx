import { useAuth } from "@clerk/expo";
import { tabs } from "@/constants/data";
import { colours, components } from "@/constants/theme";
import { cx } from "@/lib/tw";
import { Redirect, Tabs } from "expo-router";
import { Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabIconProps = {
    focused: boolean;
    icon: any;
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

    const TabIcon = ({ focused, icon }: TabIconProps) => {
        return (
            <View style={cx("tabs-icon")}>
                <View style={cx("tabs-pill", focused && "tabs-active")}>
                    <Image source={icon} style={cx("tabs-glyph")} resizeMode="contain" />
                </View>
            </View>
        )
    }
    return (<Tabs screenOptions={{
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
                        <TabIcon focused={focused} icon={tab.icon} />
                    )
                }} />
        ))}
    </Tabs>
    );
}

export default TabsLayout;