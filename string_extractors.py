@register_extractor("swift")
class SwiftStringExtractor(BaseStringExtractor):
    def extract_strings(self):
        with open(self.file_path, 'r', encoding='utf-8') as file:
            code = file.read()

        strings = []
        ui_strings = []  # Strings from UI components (like Text)
        
        if self.file_path.endswith(('.storyboard', '.xib')):
            for pattern in self.patterns.get('ui_patterns', []):
                matches = re.findall(pattern['pattern'], code)
                strings.extend(matches)
        else:
            for pattern in self.patterns.get('code_patterns', []):
                matches = re.findall(pattern['pattern'], code)
                
                # Special handling for UI component texts like Text()
                if pattern.get('name') in ['text_component']:
                    ui_strings.extend(matches)
                else:
                    strings.extend(matches)

        # Basic filtering
        filtered_strings = self.filter_strings(strings)
        
        # Add UI strings (these are usually texts that need translation)
        filtered_strings.extend(ui_strings)
        
        # Swift-specific advanced filtering
        return self.swift_advanced_filtering(filtered_strings)
        
    def is_swift_system_string(self, string):
        """Checks if the string is a system resource reference in Swift"""
        # Patterns for system resource references
        system_patterns = [
            # SF Symbols and system image names
            r'^Image\(systemName:.*\)$',
            r'^UIImage\(systemName:.*\)$',
            r'^SF[A-Za-z]*\(systemName:.*\)$',
            r'^systemName:.*$',
            r'^named:.*$',
            
            # SwiftUI common control patterns with labels
            r'^TextField\(".*", text:.*\)$',
            r'^SecureField\(".*", text:.*\)$',
            r'^DatePicker\(".*", selection:.*\)$',
            r'^Picker\(".*", selection:.*\)$',
            r'^Toggle\(".*", isOn:.*\)$',
            r'^Button\(".*"\).*$',
            r'^NavigationLink\(".*",.*\)$',
            r'^Menu\(".*"\).*$',
            r'^TabItem\(".*", .*\)$',
            r'^ToolbarItem\(.*\)$',
            r'^Label\(".*", .*\)$',
            
            # SwiftUI view modifiers
            r'^\.navigationTitle\(".*"\)$',
            r'^\.navigationBarTitle\(".*"\)$',
            r'^\.tabItem\(.*\)$',
            r'^\.alert\(".*", isPresented:.*\)$',
            
            # Other system symbols
            r'^Symbol\(.*\)$',
            r'^Icon\(.*\)$',
            r'^NSLocalizedString\(.*\)$',
        ]
        
        return any(re.match(pattern, string.strip()) for pattern in system_patterns)
    
    def swift_advanced_filtering(self, strings):
        """Advanced filtering specific to Swift"""
        filtered_strings = []
        
        # Get filtering patterns from pattern config
        additional_patterns = self.patterns.get('filtering_patterns', [])
        keywords = self.patterns.get('keywords_to_ignore', [])
        
        for s in strings:
            s = s.strip()
            
            # Skip empty strings
            if not s:
                continue
                
            # Skip if it's a system resource string
            if self.is_swift_system_string(s):
                continue
                
            # Filter according to additional patterns
            if additional_patterns and any(re.search(pattern, s) for pattern in additional_patterns):
                continue
                
            # Filter according to keywords
            if keywords and s in keywords:
                continue
            
            # Common UI component parameter names that shouldn't be translated
            common_param_names = [
                "id", "alignment", "spacing", "padding", "offset", "opacity", "cornerRadius",
                "lineLimit", "width", "height", "leading", "trailing", "top", "bottom",
                "center", "font", "foregroundColor", "backgroundColor", "accentColor",
                "tint", "shadow", "border", "frame", "position", "scale", "rotation",
                "onAppear", "onDisappear", "onChange", "onTapGesture", "onLongPressGesture"
            ]
            
            if s in common_param_names:
                continue
            
            # Add strings that have natural language characteristics and are suitable for translation
            if self.has_natural_language_characteristics(s) and self.is_valid_string_for_translation(s):
                filtered_strings.append(s)
                
        return filtered_strings 