import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  /*
   * Login Styles
   */

  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 65,
    height: 65,
    backgroundColor: '#009966',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#101828',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6a7282',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#676767',
    marginTop: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 50,
    marginTop: 6,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#101828',
  },
  error: {
    color: '#ff2056',
    fontSize: 12,
    marginTop: 4,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotText: {
    color: '#009966',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  button: {
    backgroundColor: '#009966',
    marginTop: 20,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 1,
    marginTop: 10,
    marginBottom: 25,
  },
  contactLink: {
    color: '#009966',
    fontSize: 13,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  signupText: {
    color: '#009966',
    fontWeight: '600',
    fontSize: 15,
  },
    divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
    line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
    orText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 12,
  },
    socialButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  socialText: {
    color: '#111827',
    fontWeight: '500',
  },
  socialIcon: {
   width: 20,
   height: 20,
   marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  supportIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleS: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 8,
  },
  closeButtonS: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6a7282',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  supportInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#009966',
  },
  supportInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  supportLabel: {
    fontSize: 12,
    color: '#6a7282',
    fontWeight: '500',
    marginBottom: 4,
  },
  supportValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#101828',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copiedText: {
    fontSize: 12,
    color: '#009966',
    fontWeight: '600',
    marginTop: 2,
  },
  modalPrimaryButton: {
    backgroundColor: '#009966',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  /*
   * Signup Styles
   */

  containerS: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 24, flexGrow: 1, justifyContent: 'center'},
  errorBorder: { borderColor: '#ff2056' },

  /* Terms Container */
  termsContainer: {
    marginTop: 26,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    color: '#6a7282',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  termsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FAF7',
    borderWidth: 1.5,
    borderColor: '#009966',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 26,
  },
  termsLink: {
    color: '#009966',
    fontWeight: '600',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#009966',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  statusMessage: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  statusSuccess: { color: '#009966' },
  statusError: { color: '#ff2056' },
  or: { marginHorizontal: 10, color: '#9CA3AF', fontSize: 12 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  loginLink: { 
    color: '#009966',
    fontSize:15, 
    fontWeight: '600' 
  },
  modalContentS: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  documentIconCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#ECFDF5',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 8,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    padding: 8,
  },
  modalScroll: {
    maxHeight: 350,
    marginBottom: 16,
  },
  modalBody: {
    paddingRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
    marginTop: 16,
    marginBottom: 12,
  },
  policySection: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  policyText: {
    marginLeft: 12,
    flex: 1,
  },
  policyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 13,
    color: '#6a7282',
    lineHeight: 18,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6a7282',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },

  /*
   * Forgot Password Styles
   */

  pageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitleF: {
    fontSize: 14,
    color: '#6a7282',
    marginTop: 6,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff2056',
    fontSize: 12,
    marginTop: 6,
  },
  primaryButtonF: {
    backgroundColor: '#009966',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#101828',
    fontWeight: '500',
  },
  emailBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
  },
  emailText: {
    fontWeight: '600',
    color: '#101828',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 13,
    color: '#6a7282',
    textAlign: 'center',
    marginBottom: 16,
  },
  successCircle: {
    width: 70,
    height: 70,
    backgroundColor: '#ECFDF5',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  successTitle: {
   fontSize: 22,
   fontWeight: '700',
   color: '#101828',
   textAlign: 'center',
   marginBottom: 8,
  },
  goToSignInButton: {
    alignSelf: 'center',
  },
  goToSignInAccent: {
    color: '#009966',
    fontWeight: '600',
  },
  successMessage: {
    fontSize: 14,
    color: '#009966',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  modalContentF: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '80%',
  },
});