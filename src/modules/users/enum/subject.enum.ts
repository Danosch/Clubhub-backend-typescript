/**
 * Academic subjects supported by user profiles.
 *
 * TODO: Replace the fixed enum with a database-backed subject catalog
 * exposed through an API, so subjects can be managed without requiring
 * backend or frontend releases.
 */
export enum Subject {
    NONE = 'NONE',
    COMPUTER_SCIENCE = 'COMPUTER_SCIENCE',
    MATHEMATICS = 'MATHEMATICS',
    PHYSICS = 'PHYSICS',
    ENGINEERING = 'ENGINEERING',
    BUSINESS = 'BUSINESS',
    LAW = 'LAW',
    MEDICINE = 'MEDICINE',
    ARCHITECTURE = 'ARCHITECTURE',
    CIVIL_ENGINEERING = 'CIVIL_ENGINEERING',
    ELECTRICAL_ENGINEERING = 'ELECTRICAL_ENGINEERING',
    MECHANICAL_ENGINEERING = 'MECHANICAL_ENGINEERING',
    MEDIA_DESIGN = 'MEDIA_DESIGN',
    SOCIAL_WORK = 'SOCIAL_WORK',
    BUSINESS_ADMINISTRATION = 'BUSINESS_ADMINISTRATION',
    INDUSTRIAL_ENGINEERING = 'INDUSTRIAL_ENGINEERING',
}