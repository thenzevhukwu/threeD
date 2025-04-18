import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  MenuProvider,
} from 'react-native-popup-menu';
import { theme } from '@/constants/theme';

const options: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string }> = [
  { icon: 'ban-outline', label: 'Not interested in this post' },
  { icon: 'person-add-outline', label: 'Follow @heyrapto' },
  { icon: 'list-outline', label: 'Add/remove @heyrapto from Lists' },
  { icon: 'volume-mute-outline', label: 'Mute @heyrapto' },
  { icon: 'hand-left-outline', label: 'Block @heyrapto' },
  { icon: 'analytics-outline', label: 'View post engagements' },
  { icon: 'code-slash-outline', label: 'Embed post' },
  { icon: 'flag-outline', label: 'Report post' },
  { icon: 'information-circle-outline', label: 'Request Community Note' },
];

export default function PostMenu() {
  return (
    <MenuProvider>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Menu>
          <MenuTrigger customStyles={{ TriggerTouchableComponent: TouchableOpacity }}>
            <Ionicons name="ellipsis-horizontal" size={24} color="black" />
          </MenuTrigger>

          <MenuOptions customStyles={{ optionsContainer: { backgroundColor: 'black', padding: 8, borderRadius: 8 } }}>
            {options.map((option, index) => (
              <MenuOption key={index} onSelect={() => console.log(option.label)}>
                <View style={styles.optionButton}>
                  <Ionicons name={option.icon} size={15} color={theme.white} style={{ marginRight: 10 }} />
                  <Text style={[styles.optionText, { color: theme.white }]}>{option.label}</Text>
                </View>
              </MenuOption>
            ))}
          </MenuOptions>
        </Menu>
      </View>
    </MenuProvider>
  );
}

const styles = StyleSheet.create({
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  optionText: {
    fontSize: 14,
  },
});
