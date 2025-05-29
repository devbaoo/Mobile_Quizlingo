import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

export const Footer = () => {
    return (
        <View>
            {/* Section 1 */}
            <View style={styles.section}>
                <View style={styles.row}>
                    {/* Left Text Content */}
                    <View style={styles.flex1}>
                        <Text style={styles.footerTitle}>
                            miễn phí. vui nhộn. <Text style={styles.hideOnSmall}>hiệu quả</Text>
                        </Text>
                        <Text style={styles.footerDescription}>
                            Học cùng Quizlingo rất vui nhộn,{' '}
                            <Text style={styles.highlightText}>
                                các nghiên cứu đã chứng minh ứng dụng thật sự hiệu quả
                            </Text>
                            ! Các bài học nhỏ gọn sẽ giúp bạn ghi điểm, mở khóa cấp độ mới và luyện tập kỹ năng giao tiếp hữu dụng.
                        </Text>
                    </View>
                    {/* Right Image */}
                    <View style={styles.flex1Center}>
                        <Image
                            source={{ uri: 'https://media.giphy.com/media/gtgdV9KXZpgUjswDS6/giphy.gif' }}
                            style={styles.footerImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>
            </View>

            {/* Section 2 */}
            <View style={styles.section}>
                <View style={styles.rowReverse}>
                    {/* Left Image */}
                    <View style={styles.flex1Center}>
                        <Image
                            source={{ uri: 'https://media.giphy.com/media/cDvnVlETDQUl8xh5jK/giphy.gif' }}
                            style={styles.footerImage}
                            resizeMode="contain"
                        />
                    </View>
                    {/* Right Text */}
                    <View style={styles.flex1}>
                        <Text style={styles.footerTitle}>
                            Dựa trên căn cứ khoa học
                        </Text>
                        <Text style={styles.footerDescription}>
                            Chúng tôi kết hợp các phương pháp giảng dạy khoa học với nội dung học thú vị để tạo nên những khóa học hữu ích giúp bạn luyện tập nghe, nói, đọc và viết!
                        </Text>
                    </View>
                </View>
            </View>

            {/* Section 3 */}
            <View style={styles.sectionWide}>
                <View style={styles.row}>
                    {/* Text content on the left */}
                    <View style={styles.flex1ColumnLeft}>
                        <Text style={styles.footerTitle}>
                            tiếp thêm động lực
                        </Text>
                        <Text style={styles.footerDescription}>
                            Ứng dụng giúp người học dễ dàng xây dựng thói quen học tập, qua những tính năng mô phỏng trò chơi, các thử thách vui vẻ, và nhắc nhở từ người bạn thân thiện – cú Quiz.
                        </Text>
                    </View>
                    {/* Image on the right */}
                    <View style={styles.flex1Center}>
                        <Image
                            source={{ uri: 'https://media.giphy.com/media/kQulaQZ8vc6UUkBS6O/giphy.gif' }}
                            style={styles.footerImageLarge}
                            resizeMode="contain"
                        />
                    </View>
                </View>
            </View>

            {/* Section 4 */}
            <View style={styles.sectionWide}>
                <View style={styles.rowReverse}>
                    {/* Image section */}
                    <View style={styles.flex1Center}>
                        <Image
                            source={{ uri: 'https://media.giphy.com/media/TkQAT5kmemGUp5Ok4U/giphy.gif' }}
                            style={styles.footerImage}
                            resizeMode="contain"
                        />
                    </View>
                    {/* Text section */}
                    <View style={styles.flex1ColumnLeft}>
                        <Text style={styles.footerTitle}>
                            cá nhân hóa trải nghiệm học
                        </Text>
                        <Text style={styles.footerDescription}>
                            Kết hợp những điểm mạnh nhất của trí tuệ nhân tạo (AI) và khoa học về ngôn ngữ, các bài học được cá nhân hóa để giúp bạn tìm được cấp độ và nhịp độ học phù hợp nhất.
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    section: {
        width: '100%',
        backgroundColor: '#fff',
        paddingVertical: 32,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    sectionWide: {
        width: '100%',
        backgroundColor: '#fff',
        paddingVertical: 32,
        paddingHorizontal: 16,
        alignItems: 'center',
        maxWidth: 988,
        alignSelf: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        width: '100%',
    },
    rowReverse: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        width: '100%',
    },
    flex1: {
        flex: 1,
        padding: 8,
    },
    flex1Center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    flex1ColumnLeft: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 8,
    },
    footerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#3B82F6',
        marginBottom: 16,
        textAlign: 'left',
    },
    footerDescription: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
        marginBottom: 8,
        textAlign: 'left',
    },
    highlightText: {
        color: '#10B981',
        fontWeight: 'bold',
    },
    footerImage: {
        width: 200,
        height: 200,
        marginVertical: 8,
    },
    footerImageLarge: {
        width: 320,
        height: 200,
        marginVertical: 8,
    },
    hideOnSmall: {
        // Không dùng được <br/> như web, nên chỉ để text bình thường
    },
});

export default Footer; 