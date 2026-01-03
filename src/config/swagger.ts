import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'منصة الداعم التعليمي الذكي - Smart Education API',
      version: '1.0.0',
      description: `
        منصة تعليمية ذكية شاملة تدعم التعلم التفاعلي والذكاء الاصطناعي
        
        ## الميزات الرئيسية:
        - 🔐 نظام مصادقة وتفويض متقدم
        - 👥 إدارة المستخدمين (طلاب، معلمين، إداريين)
        - 📚 إدارة المحتوى التعليمي
        - 📝 نظام الاختبارات والتقييم
        - 📋 إدارة الواجبات والتكليفات
        - 🎯 نظام النقاط والتحفيز
        - 🔔 نظام الإشعارات المتقدم
        - 🏫 إدارة المدارس والصفوف
        - 👨‍🎓 تسجيل ونقل الطلاب
        - 📋 خطط التعويض والتعزيز
        - 🔍 الاختبارات التشخيصية
        - 🤖 الذكاء الاصطناعي التعليمي
        - 📊 التحليلات والتقارير
        
        ## المصادقة:
        يستخدم النظام JWT tokens للمصادقة. أضف التوكن في الهيدر:
        \`Authorization: Bearer <your-token>\`
      `,
      contact: {
        name: 'Smart Education Team',
        email: 'support@smart-edu.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.smart-edu.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            uuid: {
              type: 'string',
              format: 'uuid',
              description: 'User UUID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            firstName: {
              type: 'string',
              description: 'First name'
            },
            lastName: {
              type: 'string',
              description: 'Last name'
            },
            role: {
              type: 'string',
              enum: ['student', 'teacher', 'admin'],
              description: 'User role'
            },
            isActive: {
              type: 'boolean',
              description: 'Account status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
              example: 'student@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password',
              example: 'password123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User'
            },
            accessToken: {
              type: 'string',
              description: 'JWT access token'
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token'
            },
            expiresIn: {
              type: 'integer',
              description: 'Token expiration time in seconds'
            }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Notification ID'
            },
            uuid: {
              type: 'string',
              format: 'uuid',
              description: 'Notification UUID'
            },
            userId: {
              type: 'integer',
              description: 'Recipient user ID'
            },
            title: {
              type: 'string',
              maxLength: 255,
              description: 'Notification title'
            },
            message: {
              type: 'string',
              maxLength: 1000,
              description: 'Notification message'
            },
            notificationType: {
              type: 'string',
              enum: ['assignment', 'grade', 'achievement', 'reminder', 'system'],
              description: 'Type of notification'
            },
            referenceId: {
              type: 'integer',
              nullable: true,
              description: 'Reference ID (optional)'
            },
            referenceType: {
              type: 'string',
              nullable: true,
              description: 'Reference type (optional)'
            },
            isRead: {
              type: 'boolean',
              description: 'Read status'
            },
            sentAt: {
              type: 'string',
              format: 'date-time',
              description: 'Sent timestamp'
            },
            readAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Read timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        School: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'School ID'
            },
            name: {
              type: 'string',
              maxLength: 255,
              description: 'School name'
            },
            address: {
              type: 'string',
              nullable: true,
              description: 'School address'
            },
            phone: {
              type: 'string',
              nullable: true,
              description: 'School phone number'
            },
            email: {
              type: 'string',
              format: 'email',
              nullable: true,
              description: 'School email'
            },
            principalName: {
              type: 'string',
              nullable: true,
              description: 'Principal name'
            },
            academicYear: {
              type: 'string',
              description: 'Academic year'
            },
            isActive: {
              type: 'boolean',
              description: 'School status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            _count: {
              type: 'object',
              properties: {
                teachers: {
                  type: 'integer',
                  description: 'Number of teachers'
                },
                classes: {
                  type: 'integer',
                  description: 'Number of classes'
                }
              }
            }
          }
        },
        CreateSchoolDto: {
          type: 'object',
          required: ['name', 'academicYear'],
          properties: {
            name: {
              type: 'string',
              maxLength: 255,
              description: 'School name',
              example: 'مدرسة الأمل الابتدائية'
            },
            address: {
              type: 'string',
              maxLength: 500,
              description: 'School address',
              example: 'شارع الملك فهد، الرياض'
            },
            phone: {
              type: 'string',
              maxLength: 20,
              description: 'School phone number',
              example: '+966112345678'
            },
            email: {
              type: 'string',
              format: 'email',
              maxLength: 100,
              description: 'School email',
              example: 'info@alamal-school.edu.sa'
            },
            principalName: {
              type: 'string',
              maxLength: 100,
              description: 'Principal name',
              example: 'أحمد محمد السعيد'
            },
            academicYear: {
              type: 'string',
              description: 'Academic year',
              example: '2024-2025'
            }
          }
        },
        Class: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Class ID'
            },
            name: {
              type: 'string',
              description: 'Class name'
            },
            gradeLevel: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              description: 'Grade level'
            },
            section: {
              type: 'string',
              nullable: true,
              description: 'Class section'
            },
            schoolId: {
              type: 'integer',
              nullable: true,
              description: 'School ID'
            },
            teacherId: {
              type: 'integer',
              nullable: true,
              description: 'Teacher ID'
            },
            academicYear: {
              type: 'string',
              description: 'Academic year'
            },
            capacity: {
              type: 'integer',
              nullable: true,
              description: 'Class capacity'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Class description'
            },
            isActive: {
              type: 'boolean',
              description: 'Class status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            school: {
              $ref: '#/components/schemas/School'
            },
            _count: {
              type: 'object',
              properties: {
                enrollments: {
                  type: 'integer',
                  description: 'Number of enrolled students'
                }
              }
            }
          }
        },
        CreateClassDto: {
          type: 'object',
          required: ['name', 'gradeLevel', 'academicYear'],
          properties: {
            name: {
              type: 'string',
              maxLength: 255,
              description: 'Class name',
              example: 'الصف الخامس - أ'
            },
            gradeLevel: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              description: 'Grade level',
              example: 5
            },
            section: {
              type: 'string',
              maxLength: 10,
              description: 'Class section',
              example: 'أ'
            },
            schoolId: {
              type: 'integer',
              description: 'School ID',
              example: 1
            },
            teacherId: {
              type: 'integer',
              description: 'Teacher ID',
              example: 1
            },
            academicYear: {
              type: 'string',
              description: 'Academic year',
              example: '2024-2025'
            },
            capacity: {
              type: 'integer',
              minimum: 10,
              maximum: 50,
              description: 'Class capacity',
              example: 30
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Class description',
              example: 'صف الخامس الابتدائي - شعبة أ'
            }
          }
        },
        StudentEnrollment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Enrollment ID'
            },
            studentId: {
              type: 'integer',
              description: 'Student ID'
            },
            classId: {
              type: 'integer',
              description: 'Class ID'
            },
            enrolledAt: {
              type: 'string',
              format: 'date-time',
              description: 'Enrollment date'
            },
            withdrawnAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Withdrawal date'
            },
            isActive: {
              type: 'boolean',
              description: 'Enrollment status'
            },
            academicYear: {
              type: 'string',
              description: 'Academic year'
            },
            student: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer'
                },
                firstName: {
                  type: 'string'
                },
                lastName: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                }
              }
            },
            class: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer'
                },
                name: {
                  type: 'string'
                },
                gradeLevel: {
                  type: 'integer'
                },
                section: {
                  type: 'string'
                }
              }
            }
          }
        },
        RecoveryPlan: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Recovery plan ID'
            },
            uuid: {
              type: 'string',
              format: 'uuid',
              description: 'Recovery plan UUID'
            },
            title: {
              type: 'string',
              description: 'Recovery plan title'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Recovery plan description'
            },
            subjectId: {
              type: 'integer',
              description: 'Subject ID'
            },
            gradeLevel: {
              type: 'integer',
              description: 'Grade level'
            },
            weekNumber: {
              type: 'integer',
              description: 'Week number'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Difficulty level'
            },
            objectives: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Learning objectives'
            },
            activities: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Activities and exercises'
            },
            resources: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Resources and materials'
            },
            estimatedHours: {
              type: 'integer',
              nullable: true,
              description: 'Estimated completion hours'
            },
            isActive: {
              type: 'boolean',
              description: 'Plan status'
            },
            createdBy: {
              type: 'integer',
              description: 'Creator user ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            subject: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                nameAr: {
                  type: 'string'
                }
              }
            },
            creator: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer'
                },
                firstName: {
                  type: 'string'
                },
                lastName: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                }
              }
            },
            _count: {
              type: 'object',
              properties: {
                studentProgress: {
                  type: 'integer',
                  description: 'Number of student assignments'
                }
              }
            }
          }
        },
        CreateRecoveryPlanDto: {
          type: 'object',
          required: ['title', 'subjectId', 'gradeLevel', 'weekNumber'],
          properties: {
            title: {
              type: 'string',
              maxLength: 255,
              description: 'Recovery plan title',
              example: 'خطة تعويض الأسبوع الأول - الرياضيات'
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Recovery plan description',
              example: 'خطة تعويضية شاملة لتقوية مهارات الجمع والطرح'
            },
            subjectId: {
              type: 'integer',
              description: 'Subject ID',
              example: 1
            },
            gradeLevel: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              description: 'Grade level',
              example: 4
            },
            weekNumber: {
              type: 'integer',
              minimum: 1,
              maximum: 52,
              description: 'Week number',
              example: 1
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Difficulty level',
              example: 'medium'
            },
            objectives: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Learning objectives',
              example: ['إتقان عمليات الجمع', 'فهم مفهوم الطرح']
            },
            activities: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Activities and exercises'
            },
            resources: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Resources and materials'
            },
            estimatedHours: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Estimated completion hours',
              example: 5
            }
          }
        },
        UpdateRecoveryPlanDto: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              maxLength: 255,
              description: 'Recovery plan title'
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Recovery plan description'
            },
            subjectId: {
              type: 'integer',
              description: 'Subject ID'
            },
            gradeLevel: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              description: 'Grade level'
            },
            weekNumber: {
              type: 'integer',
              minimum: 1,
              maximum: 52,
              description: 'Week number'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Difficulty level'
            },
            objectives: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Learning objectives'
            },
            activities: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Activities and exercises'
            },
            resources: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Resources and materials'
            },
            estimatedHours: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Estimated completion hours'
            },
            isActive: {
              type: 'boolean',
              description: 'Plan status'
            }
          }
        },
        EnhancementPlan: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Enhancement plan ID'
            },
            uuid: {
              type: 'string',
              format: 'uuid',
              description: 'Enhancement plan UUID'
            },
            title: {
              type: 'string',
              description: 'Enhancement plan title'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Enhancement plan description'
            },
            subjectId: {
              type: 'integer',
              description: 'Subject ID'
            },
            gradeLevel: {
              type: 'integer',
              description: 'Grade level'
            },
            planType: {
              type: 'string',
              enum: ['enrichment', 'acceleration', 'talent_development', 'advanced_skills', 'creative_thinking', 'leadership'],
              description: 'Enhancement plan type'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Difficulty level'
            },
            objectives: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Learning objectives'
            },
            activities: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Activities and exercises'
            },
            resources: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Resources and materials'
            },
            estimatedHours: {
              type: 'integer',
              nullable: true,
              description: 'Estimated completion hours'
            },
            prerequisites: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Required prerequisites'
            },
            isActive: {
              type: 'boolean',
              description: 'Plan status'
            },
            createdBy: {
              type: 'integer',
              description: 'Creator user ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            subject: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                nameAr: {
                  type: 'string'
                }
              }
            },
            creator: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer'
                },
                firstName: {
                  type: 'string'
                },
                lastName: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                }
              }
            },
            _count: {
              type: 'object',
              properties: {
                studentProgress: {
                  type: 'integer',
                  description: 'Number of student assignments'
                }
              }
            }
          }
        },
        CreateEnhancementPlanDto: {
          type: 'object',
          required: ['title', 'subjectId', 'gradeLevel', 'planType'],
          properties: {
            title: {
              type: 'string',
              maxLength: 255,
              description: 'Enhancement plan title',
              example: 'خطة تعزيز المهارات المتقدمة - الرياضيات'
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Enhancement plan description',
              example: 'خطة تعزيزية لتطوير مهارات الرياضيات المتقدمة'
            },
            subjectId: {
              type: 'integer',
              description: 'Subject ID',
              example: 1
            },
            gradeLevel: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              description: 'Grade level',
              example: 5
            },
            planType: {
              type: 'string',
              enum: ['enrichment', 'acceleration', 'talent_development', 'advanced_skills', 'creative_thinking', 'leadership'],
              description: 'Enhancement plan type',
              example: 'advanced_skills'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Difficulty level',
              example: 'hard'
            },
            objectives: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Learning objectives',
              example: ['تطوير مهارات حل المسائل المعقدة', 'إتقان الرياضيات التطبيقية']
            },
            activities: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Activities and exercises'
            },
            resources: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Resources and materials'
            },
            estimatedHours: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Estimated completion hours',
              example: 10
            },
            prerequisites: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Required prerequisites',
              example: ['إتقان العمليات الأساسية', 'فهم الكسور']
            }
          }
        },
        UpdateEnhancementPlanDto: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              maxLength: 255,
              description: 'Enhancement plan title'
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Enhancement plan description'
            },
            subjectId: {
              type: 'integer',
              description: 'Subject ID'
            },
            gradeLevel: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              description: 'Grade level'
            },
            planType: {
              type: 'string',
              enum: ['enrichment', 'acceleration', 'talent_development', 'advanced_skills', 'creative_thinking', 'leadership'],
              description: 'Enhancement plan type'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Difficulty level'
            },
            objectives: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Learning objectives'
            },
            activities: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Activities and exercises'
            },
            resources: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Resources and materials'
            },
            estimatedHours: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Estimated completion hours'
            },
            prerequisites: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Required prerequisites'
            },
            isActive: {
              type: 'boolean',
              description: 'Plan status'
            }
          }
        },
        StudentRecoveryProgress: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Progress ID'
            },
            studentId: {
              type: 'integer',
              description: 'Student ID'
            },
            recoveryPlanId: {
              type: 'integer',
              description: 'Recovery plan ID'
            },
            assignedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Assignment date'
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Start date'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Completion date'
            },
            status: {
              type: 'string',
              enum: ['assigned', 'in_progress', 'completed', 'paused', 'cancelled'],
              description: 'Progress status'
            },
            progressData: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Activity progress data'
            },
            completionRate: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Completion percentage'
            },
            timeSpent: {
              type: 'integer',
              description: 'Time spent in minutes'
            },
            notes: {
              type: 'string',
              nullable: true,
              description: 'Progress notes'
            },
            assignedBy: {
              type: 'integer',
              description: 'Assigner user ID'
            },
            academicYear: {
              type: 'string',
              description: 'Academic year'
            }
          }
        },
        StudentEnhancementProgress: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Progress ID'
            },
            studentId: {
              type: 'integer',
              description: 'Student ID'
            },
            enhancementPlanId: {
              type: 'integer',
              description: 'Enhancement plan ID'
            },
            assignedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Assignment date'
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Start date'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Completion date'
            },
            status: {
              type: 'string',
              enum: ['assigned', 'in_progress', 'completed', 'paused', 'cancelled'],
              description: 'Progress status'
            },
            progressData: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Activity progress data'
            },
            completionRate: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Completion percentage'
            },
            timeSpent: {
              type: 'integer',
              description: 'Time spent in minutes'
            },
            notes: {
              type: 'string',
              nullable: true,
              description: 'Progress notes'
            },
            assignedBy: {
              type: 'integer',
              description: 'Assigner user ID'
            },
            academicYear: {
              type: 'string',
              description: 'Academic year'
            }
          }
        },
        UpdateProgressDto: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['assigned', 'in_progress', 'completed', 'paused', 'cancelled'],
              description: 'Progress status'
            },
            progressData: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Activity progress data'
            },
            completionRate: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Completion percentage'
            },
            timeSpent: {
              type: 'integer',
              minimum: 0,
              description: 'Time spent in minutes'
            },
            notes: {
              type: 'string',
              maxLength: 1000,
              description: 'Progress notes'
            }
          }
        },
        PaginatedRecoveryPlans: {
          type: 'object',
          properties: {
            plans: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/RecoveryPlan'
              }
            },
            total: {
              type: 'integer',
              description: 'Total number of plans'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        },
        PaginatedEnhancementPlans: {
          type: 'object',
          properties: {
            plans: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/EnhancementPlan'
              }
            },
            total: {
              type: 'integer',
              description: 'Total number of plans'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        },
        PaginatedRecoveryProgress: {
          type: 'object',
          properties: {
            progress: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/StudentRecoveryProgress'
              }
            },
            total: {
              type: 'integer',
              description: 'Total number of progress records'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        },
        PaginatedEnhancementProgress: {
          type: 'object',
          properties: {
            progress: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/StudentEnhancementProgress'
              }
            },
            total: {
              type: 'integer',
              description: 'Total number of progress records'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        },
        PlanStatistics: {
          type: 'object',
          properties: {
            totalPlans: {
              type: 'integer',
              description: 'Total number of plans'
            },
            activePlans: {
              type: 'integer',
              description: 'Number of active plans'
            },
            totalAssignments: {
              type: 'integer',
              description: 'Total number of assignments'
            },
            completedAssignments: {
              type: 'integer',
              description: 'Number of completed assignments'
            },
            averageCompletionRate: {
              type: 'number',
              description: 'Average completion rate percentage'
            },
            averageTimeSpent: {
              type: 'number',
              description: 'Average time spent in minutes'
            },
            subjectDistribution: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  subjectId: {
                    type: 'integer'
                  },
                  subjectName: {
                    type: 'string'
                  },
                  planCount: {
                    type: 'integer'
                  },
                  assignmentCount: {
                    type: 'integer'
                  }
                }
              }
            },
            gradeDistribution: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  gradeLevel: {
                    type: 'integer'
                  },
                  planCount: {
                    type: 'integer'
                  },
                  assignmentCount: {
                    type: 'integer'
                  }
                }
              }
            }
          }
        },
        StudentPlanSummary: {
          type: 'object',
          properties: {
            studentId: {
              type: 'integer',
              description: 'Student ID'
            },
            totalRecoveryPlans: {
              type: 'integer',
              description: 'Total recovery plans assigned'
            },
            completedRecoveryPlans: {
              type: 'integer',
              description: 'Completed recovery plans'
            },
            totalEnhancementPlans: {
              type: 'integer',
              description: 'Total enhancement plans assigned'
            },
            completedEnhancementPlans: {
              type: 'integer',
              description: 'Completed enhancement plans'
            },
            averageCompletionRate: {
              type: 'number',
              description: 'Average completion rate percentage'
            },
            totalTimeSpent: {
              type: 'number',
              description: 'Total time spent in minutes'
            },
            currentPlans: {
              type: 'object',
              properties: {
                recovery: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/StudentRecoveryProgress'
                  }
                },
                enhancement: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/StudentEnhancementProgress'
                  }
                }
              }
            }
          }
        },
        PlanEffectivenessReport: {
          type: 'object',
          properties: {
            planId: {
              type: 'integer',
              description: 'Plan ID'
            },
            planTitle: {
              type: 'string',
              description: 'Plan title'
            },
            planType: {
              type: 'string',
              enum: ['recovery', 'enhancement'],
              description: 'Plan type'
            },
            totalAssignments: {
              type: 'integer',
              description: 'Total assignments'
            },
            completedAssignments: {
              type: 'integer',
              description: 'Completed assignments'
            },
            averageCompletionRate: {
              type: 'number',
              description: 'Average completion rate'
            },
            averageTimeSpent: {
              type: 'number',
              description: 'Average time spent'
            },
            studentFeedback: {
              type: 'object',
              properties: {
                averageRating: {
                  type: 'number',
                  nullable: true,
                  description: 'Average student rating'
                },
                totalFeedback: {
                  type: 'integer',
                  description: 'Total feedback count'
                }
              }
            },
            effectiveness: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Plan effectiveness level'
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Improvement recommendations'
            }
          }
        },
        DiagnosticTest: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Diagnostic test ID'
            },
            uuid: {
              type: 'string',
              format: 'uuid',
              description: 'Diagnostic test UUID'
            },
            title: {
              type: 'string',
              description: 'Test title'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Test description'
            },
            subjectId: {
              type: 'integer',
              description: 'Subject ID'
            },
            gradeLevel: {
              type: 'integer',
              description: 'Grade level'
            },
            testType: {
              type: 'string',
              enum: ['written', 'oral', 'practical'],
              description: 'Test type'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Difficulty level'
            },
            totalMarks: {
              type: 'integer',
              description: 'Total marks'
            },
            passingMarks: {
              type: 'integer',
              description: 'Passing marks'
            },
            isActive: {
              type: 'boolean',
              description: 'Test status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        },
        CreateDiagnosticTestDto: {
          type: 'object',
          required: ['title', 'subjectId', 'gradeLevel', 'testType', 'difficulty', 'totalMarks', 'passingMarks'],
          properties: {
            title: {
              type: 'string',
              maxLength: 255,
              description: 'Test title',
              example: 'اختبار تشخيصي - الرياضيات'
            },
            description: {
              type: 'string',
              description: 'Test description'
            },
            subjectId: {
              type: 'integer',
              description: 'Subject ID',
              example: 1
            },
            gradeLevel: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              description: 'Grade level',
              example: 5
            },
            testType: {
              type: 'string',
              enum: ['written', 'oral', 'practical'],
              description: 'Test type',
              example: 'written'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Difficulty level',
              example: 'medium'
            },
            totalMarks: {
              type: 'integer',
              minimum: 1,
              description: 'Total marks',
              example: 100
            },
            passingMarks: {
              type: 'integer',
              minimum: 1,
              description: 'Passing marks',
              example: 60
            }
          }
        },
        DiagnosticTestResult: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Result ID'
            },
            testId: {
              type: 'integer',
              description: 'Test ID'
            },
            studentId: {
              type: 'integer',
              description: 'Student ID'
            },
            score: {
              type: 'integer',
              description: 'Score achieved'
            },
            percentage: {
              type: 'number',
              description: 'Percentage score'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'reviewed'],
              description: 'Result status'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Completion timestamp'
            }
          }
        },
        PaginatedDiagnosticTests: {
          type: 'object',
          properties: {
            tests: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/DiagnosticTest'
              }
            },
            total: {
              type: 'integer',
              description: 'Total number of tests'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        },
        DiagnosticTestQuestion: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Question ID'
            },
            testId: {
              type: 'integer',
              description: 'Test ID'
            },
            questionText: {
              type: 'string',
              description: 'Question text'
            },
            questionType: {
              type: 'string',
              enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'],
              description: 'Question type'
            },
            options: {
              type: 'array',
              items: {
                type: 'object'
              },
              nullable: true,
              description: 'Answer options for multiple choice'
            },
            correctAnswer: {
              type: 'string',
              description: 'Correct answer'
            },
            marks: {
              type: 'integer',
              description: 'Marks for this question'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Question difficulty'
            },
            skillArea: {
              type: 'string',
              nullable: true,
              description: 'Skill area being tested'
            },
            orderIndex: {
              type: 'integer',
              description: 'Question order in test'
            }
          }
        },
        CreateDiagnosticTestQuestionDto: {
          type: 'object',
          required: ['questionText', 'questionType', 'correctAnswer', 'marks'],
          properties: {
            questionText: {
              type: 'string',
              description: 'Question text',
              example: 'ما هو ناتج 5 + 3؟'
            },
            questionType: {
              type: 'string',
              enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'],
              description: 'Question type',
              example: 'multiple_choice'
            },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              },
              description: 'Answer options',
              example: [
                { text: '6', value: 'a' },
                { text: '7', value: 'b' },
                { text: '8', value: 'c' },
                { text: '9', value: 'd' }
              ]
            },
            correctAnswer: {
              type: 'string',
              description: 'Correct answer',
              example: 'c'
            },
            marks: {
              type: 'integer',
              minimum: 1,
              description: 'Marks for this question',
              example: 2
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Question difficulty',
              example: 'easy'
            },
            skillArea: {
              type: 'string',
              description: 'Skill area being tested',
              example: 'الجمع الأساسي'
            },
            orderIndex: {
              type: 'integer',
              minimum: 1,
              description: 'Question order in test',
              example: 1
            }
          }
        },
        DiagnosticTestAttachment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Attachment ID'
            },
            testId: {
              type: 'integer',
              description: 'Test ID'
            },
            fileName: {
              type: 'string',
              description: 'Original file name'
            },
            filePath: {
              type: 'string',
              description: 'File storage path'
            },
            fileType: {
              type: 'string',
              description: 'File MIME type'
            },
            fileSize: {
              type: 'integer',
              description: 'File size in bytes'
            },
            uploadedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Upload timestamp'
            }
          }
        },
        UpdateDiagnosticTestDto: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              maxLength: 255,
              description: 'Test title'
            },
            description: {
              type: 'string',
              description: 'Test description'
            },
            subjectId: {
              type: 'integer',
              description: 'Subject ID'
            },
            gradeLevel: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              description: 'Grade level'
            },
            testType: {
              type: 'string',
              enum: ['written', 'oral', 'practical'],
              description: 'Test type'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Difficulty level'
            },
            totalMarks: {
              type: 'integer',
              minimum: 1,
              description: 'Total marks'
            },
            passingMarks: {
              type: 'integer',
              minimum: 1,
              description: 'Passing marks'
            },
            isActive: {
              type: 'boolean',
              description: 'Test status'
            }
          }
        },
        CreateDiagnosticTestResultDto: {
          type: 'object',
          required: ['testId', 'studentId', 'answers'],
          properties: {
            testId: {
              type: 'integer',
              description: 'Test ID',
              example: 1
            },
            studentId: {
              type: 'integer',
              description: 'Student ID',
              example: 1
            },
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: {
                    type: 'integer'
                  },
                  answer: {
                    type: 'string'
                  },
                  timeSpent: {
                    type: 'integer'
                  }
                }
              },
              description: 'Student answers',
              example: [
                { questionId: 1, answer: 'c', timeSpent: 30 },
                { questionId: 2, answer: 'true', timeSpent: 25 }
              ]
            },
            timeSpent: {
              type: 'integer',
              minimum: 0,
              description: 'Total time spent in seconds',
              example: 1800
            },
            notes: {
              type: 'string',
              description: 'Additional notes'
            }
          }
        },
        DiagnosticTestAnalysis: {
          type: 'object',
          properties: {
            testId: {
              type: 'integer',
              description: 'Test ID'
            },
            studentId: {
              type: 'integer',
              description: 'Student ID'
            },
            overallScore: {
              type: 'number',
              description: 'Overall score percentage'
            },
            skillAreas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  skillArea: {
                    type: 'string'
                  },
                  score: {
                    type: 'number'
                  },
                  maxScore: {
                    type: 'number'
                  },
                  percentage: {
                    type: 'number'
                  },
                  status: {
                    type: 'string',
                    enum: ['strong', 'adequate', 'needs_improvement', 'weak']
                  }
                }
              },
              description: 'Performance by skill area'
            },
            weaknessAreas: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Identified weakness areas'
            },
            strengthAreas: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Identified strength areas'
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['recovery_plan', 'enhancement_plan', 'practice', 'review']
                  },
                  description: {
                    type: 'string'
                  },
                  priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low']
                  }
                }
              },
              description: 'AI-generated recommendations'
            },
            suggestedRecoveryPlans: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  planId: {
                    type: 'integer'
                  },
                  title: {
                    type: 'string'
                  },
                  relevanceScore: {
                    type: 'number'
                  },
                  reason: {
                    type: 'string'
                  }
                }
              },
              description: 'Suggested recovery plans'
            }
          }
        },
        PaginatedDiagnosticTestResults: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/DiagnosticTestResult'
              }
            },
            total: {
              type: 'integer',
              description: 'Total number of results'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'غير مصرح - يتطلب تسجيل دخول',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Unauthorized access'
                  }
                }
              }
            }
          }
        },
        InternalServerError: {
          description: 'خطأ في الخادم',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Internal server error'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/index.ts'
  ]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI setup
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c5aa0 }
    `,
    customSiteTitle: 'Smart Education API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2
    }
  }));

  // JSON endpoint for the swagger spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export { specs };