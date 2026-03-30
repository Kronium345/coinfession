import { tabs } from "@/constants/data";
import { colours, components } from "@/constants/theme";
import clsx from "clsx";
import { Tabs } from "expo-router";
import { Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "twrnc";
import { colors } from "../../theme";

type TabIconProps = {
    focused: boolean;
    icon: any;
};

const classMap = {
    "tabs-icon": tw.style("h-12 w-12 items-center justify-center"),
    "tabs-pill": {
        ...tw.style("h-12 w-12 items-center justify-center rounded-full"),
        backgroundColor: "transparent",
    },
    "tabs-active": { backgroundColor: colors.accent },
    "tabs-glyph": tw.style("h-6 w-6"),
};

const cx = (...inputs: Array<string | false | null | undefined>) => {
    const tokens = clsx(inputs).split(" ").filter(Boolean);
    const resolved = tokens.map((token) => classMap[token as keyof typeof classMap] ?? tw.style(token));
    return tw.style(...resolved);
};

const tabBar = components.tabBar;

const TabsLayout = () => {
    const insets = useSafeAreaInsets();

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