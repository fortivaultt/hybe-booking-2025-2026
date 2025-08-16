# HYBE Subscription Test IDs

For testing purposes, here are valid subscription IDs that can be used:

## Premium Members (15% discount)

- `HYBABC1234567` - Kim Taehyung
- `HYBGHI5555555` - Jeon Jungkook
- `HYBPQR8888888` - Jung Hoseok
- `HYBAAA6666666` - Park Chaeyoung
- `HYBDDD1234321` - Hanni Pham

## Elite Members (10% discount)

- `HYBDEF9876543` - Park Jimin
- `HYBJKL7777777` - Kim Namjoon
- `HYBSTU1111111` - Kim Seokjin
- `HYBYZZ4444444` - Kim Jennie
- `HYBCCC0000000` - Minji Kim
- `HYBFFF9012345` - Haerin Kang

## Standard Members

- `B07200EF6667` - Radhika Verma
- `HYB10250GB0680` - Elisabete Magalhaes
- `HYB59371A4C9F2` - MEGHANA VAISHNAVI

## How to Test

1. Enter any of the above subscription IDs in the booking form
2. The system will validate against the backend database
3. Upon successful validation, the owner's name will be displayed in green below the input
4. Subscription benefits will be automatically applied

## Production Notes

- All subscription IDs follow the format: HYB + 10 alphanumeric characters
- Real validation occurs against the PostgreSQL database
- User names are fetched from the backend for verified subscribers
- Invalid IDs will show appropriate error messages
